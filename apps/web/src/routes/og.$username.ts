import { createFileRoute } from "@tanstack/react-router";

import { renderModelToPng } from "@runeprofile/model-renderer/rasterizer";
import { SKILLS, getLevelFromXP } from "@runeprofile/runescape";

import AccountTypeIconsShadowed from "~/core/assets/account-type-icons-shadowed.json";
import CombatAchievementTierIcons from "~/core/assets/combat-achievement-tier-icons.json";
import CollectionLogRankIcons from "~/core/assets/collection-log-rank-icons.json";
import OgFrame from "~/core/assets/og-frame.json";
import { RuneProfileApiError, getProfile, getProfileModel } from "~/core/api";
// Satori needs raw TTF bytes. The fonts are inlined into the bundle as data
// URIs (a Worker can't fetch() its own hostname to load them as assets).
import runescapeBoldFont from "~/core/assets/fonts/runescape-bold.ttf?inline";
import runescapeFont from "~/core/assets/fonts/runescape.ttf?inline";
import cardTexture from "~/core/assets/card/background-noshadow.png?inline";
import caIcon from "~/core/assets/icons/combat-achievements-small.png?inline";
import skillsIcon from "~/core/assets/icons/skills.png?inline";
import logoImage from "~/core/assets/misc/logo.png?inline";

function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return base64ToBytes(base64).buffer as ArrayBuffer;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

let fonts:
  | { name: string; data: ArrayBuffer; weight: number; style: "normal" }[]
  | null = null;

function loadFonts() {
  fonts ??= [
    {
      name: "RuneScape",
      data: dataUriToArrayBuffer(runescapeFont),
      weight: 400,
      style: "normal" as const,
    },
    {
      name: "RuneScape",
      data: dataUriToArrayBuffer(runescapeBoldFont),
      weight: 700,
      style: "normal" as const,
    },
  ];
  return fonts;
}

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Same thresholds as getCollectionLogRankIcon in the web UI (which lives in
// a module that drags in three.js, so it isn't imported here).
function collectionLogRankIcon(uniqueItemsObtained: number): string {
  const rank =
    uniqueItemsObtained >= 1400
      ? "gilded"
      : uniqueItemsObtained >= 1200
        ? "dragon"
        : uniqueItemsObtained >= 1100
          ? "rune"
          : uniqueItemsObtained >= 1000
            ? "adamant"
            : uniqueItemsObtained >= 900
              ? "mithril"
              : uniqueItemsObtained >= 700
                ? "black"
                : uniqueItemsObtained >= 500
                  ? "steel"
                  : uniqueItemsObtained >= 300
                    ? "iron"
                    : "bronze";
  return `data:image/png;base64,${CollectionLogRankIcons[rank]}`;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

async function generateOgImage({ request }: { request: Request }) {
  // Everything below is server-only; the guard lets the client bundle drop
  // workers-og (and its WASM) entirely.
  if (!import.meta.env.SSR) {
    return new Response("Server only", { status: 500 });
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(request.url);
  if (cached) return cached;

  // The route matches /og/$username; og:image links use a .png suffix for
  // crawler-friendliness, so strip it from the param segment.
  const url = new URL(request.url);
  const username = decodeURIComponent(
    url.pathname.replace(/^\/og\//, "").replace(/\.png$/, ""),
  );

  let profile;
  try {
    profile = await getProfile({ username });
  } catch (error) {
    if (
      error instanceof RuneProfileApiError &&
      error.code === "AccountNotFound"
    ) {
      return new Response("Not found", { status: 404 });
    }
    throw error;
  }

  // Skills absent from the response count as level 1, same as the UI.
  const totalLevel = SKILLS.reduce(
    (total, name) =>
      total +
      getLevelFromXP(profile.skills.find((s) => s.name === name)?.xp ?? 0),
    0,
  );
  const clogCount = profile.items.length;
  const caCount = profile.combatAchievementTiers.reduce(
    (total, tier) => total + tier.completedCount,
    0,
  );

  // Chest-up portrait of the player's 3D model, rendered in software.
  // The model arrives as raw bytes in whichever format the profile last
  // synced (GLB now, PLY historically) — the rasterizer sniffs it.
  // Profiles without an uploaded model fall back to a centered layout.
  let modelDataUri: string | null = null;
  try {
    const model = await getProfileModel({ username });
    const png = await renderModelToPng(
      model,
      // 2.49 rad = chathead-style angle facing right, toward the name card.
      //
      // The canvas is the whole image, with the head anchored over the left
      // third: a canvas only as wide as the model's own column cut off
      // whatever reached past it, so a scythe or a banner ended in mid-air.
      // Given the full width, held gear simply carries on behind the name
      // and chips, and the only thing that clips it is the image edge.
      //
      // Crop to the top half of the *body* — cropRef "body" ignores what a
      // player is holding, which would otherwise dominate the framing.
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        yaw: 2.49,
        cropTop: 0.5,
        cropRef: "body",
        // Fits the crop vertically and lets broad shoulders run off the
        // sides, rather than shrinking the head to fit them in.
        fit: "height",
        centerOn: "head",
        headroomTop: 0.143,
        anchorX: 0.31,
        supersample: 2,
      },
    );
    modelDataUri = `data:image/png;base64,${bytesToBase64(png)}`;
  } catch {
    modelDataUri = null;
  }

  // Baked pixel art: whole-pixel upscale plus a black rim and drop shadow,
  // drawn at its own size so nothing resamples it. The raw 13px sprite
  // stretched to 54px was a blur, and had nothing to lift it off the card.
  const accountTypeIcon =
    AccountTypeIconsShadowed[
      profile.accountType.key as keyof typeof AccountTypeIconsShadowed
    ];
  const caTierIcon =
    CombatAchievementTierIcons[
      String(
        profile.combatAchievementTierReached,
      ) as keyof typeof CombatAchievementTierIcons
    ];

  const name = escapeHtml(profile.username);
  const nameSize =
    profile.username.length > 11 ? 68 : profile.username.length > 9 ? 80 : 92;

  const chip = (icon: string, label: string, value: string) => `
    <div style="display: flex; flex-direction: column; gap: 8px; background-color: rgba(0,0,0,0.38); padding: 16px 22px 14px 22px; border-radius: 4px; border-style: solid; border-width: 2px; border-top-color: #4b473d; border-left-color: #45413a; border-bottom-color: #24221e; border-right-color: #2b2924;">
      <div style="display: flex; align-items: center; gap: 9px;">
        <img src="${icon}" width="24" height="24" />
        <span style="font-size: 21px; color: #ff981f; text-shadow: 2px 2px 0 rgba(0,0,0,0.9);">${label}</span>
      </div>
      <span style="font-size: 42px; font-weight: 700; color: #ffff00; line-height: 1; text-shadow: 2px 2px 0 rgba(0,0,0,0.9);">${value}</span>
    </div>`;

  // The stone frame, drawn as its four corner pieces over a plain edge in
  // the same stone tone. The art joins its corners with a single black
  // outline, which against a near-black card is invisible — so the corners
  // read as four marks floating in space unless the edges are painted in.
  // Corners go up in whole pixels to stay crisp.
  const FRAME_INSET = 10;
  const FRAME_SCALE = 2;
  const cornerSize = OgFrame.corner * FRAME_SCALE;
  const corner = (key: "tl" | "tr" | "bl" | "br", position: string) => `
    <img src="data:image/png;base64,${OgFrame[key]}" width="${cornerSize}" height="${cornerSize}" style="position: absolute; ${position};" />`;
  const frameEdges = `
    <div style="display: flex; position: absolute; left: ${FRAME_INSET}px; top: ${FRAME_INSET}px; right: ${FRAME_INSET}px; bottom: ${FRAME_INSET}px; border-style: solid; border-width: ${FRAME_SCALE}px; border-color: ${OgFrame.edge};"></div>`;

  const brandRow = `
    <div style="display: flex; align-items: center; gap: 14px;">
      <img src="${logoImage}" width="42" height="42" />
      <span style="font-size: 30px; font-weight: 700; color: #ff981f; letter-spacing: 2px; text-shadow: 2px 2px 0 rgba(0,0,0,0.9);">RUNEPROFILE</span>
    </div>`;

  const nameRow = `
    <div style="display: flex; align-items: center; gap: 18px;">
      ${
        accountTypeIcon
          ? `<img src="data:image/png;base64,${accountTypeIcon.data}" width="${accountTypeIcon.width}" height="${accountTypeIcon.height}" />`
          : ""
      }
      <span style="font-size: ${nameSize}px; font-weight: 700; color: #ffff00; line-height: 1; text-shadow: 4px 4px 0 rgba(0,0,0,0.9);">${name}</span>
    </div>`;

  const chips = `
    <div style="display: flex; gap: 18px;">
      ${chip(skillsIcon, "Total Lvl", totalLevel.toLocaleString("en-US"))}
      ${chip(collectionLogRankIcon(clogCount), "Clog", clogCount.toLocaleString("en-US"))}
      ${chip(
        caTierIcon ? `data:image/png;base64,${caTierIcon}` : caIcon,
        "CAs",
        caCount.toLocaleString("en-US"),
      )}
    </div>`;

  const content = modelDataUri
    ? `
      <img src="${modelDataUri}" width="${OG_WIDTH}" height="${OG_HEIGHT}" style="position: absolute; left: 0; top: 0;" />
      <div style="display: flex; flex-direction: column; justify-content: center; gap: 30px; position: absolute; right: 84px; top: 0; bottom: 0; max-width: 560px;">
        ${brandRow}
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${nameRow}
          <div style="display: flex; width: 460px; height: 2px; background-image: linear-gradient(to right, rgba(255,152,31,0.85), rgba(255,152,31,0));"></div>
        </div>
        ${chips}
      </div>`
    : `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; position: absolute; left: 0; right: 0; top: 0; bottom: 0;">
        ${brandRow}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          ${nameRow}
          <div style="display: flex; width: 520px; height: 2px; background-image: linear-gradient(to right, rgba(255,152,31,0), rgba(255,152,31,0.85), rgba(255,152,31,0));"></div>
        </div>
        ${chips}
        <span style="font-size: 26px; color: #9f9f9f; text-shadow: 2px 2px 0 rgba(0,0,0,0.9);">runeprofile.com</span>
      </div>`;

  const html = `
    <div style="display: flex; position: relative; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background-color: #0d0d0c; font-family: 'RuneScape';">
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background-image: url(${cardTexture}); background-repeat: repeat; background-size: 60px 60px; opacity: 0.9;"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background-image: radial-gradient(circle at 86% 10%, rgba(255,152,31,0.10) 0%, rgba(255,152,31,0) 45%);"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background-image: radial-gradient(circle at 18% 46%, rgba(93,74,214,0.20) 0%, rgba(93,74,214,0) 40%);"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background-image: radial-gradient(circle at 45% 42%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 100%);"></div>
      ${content}
      ${frameEdges}
      ${corner("tl", `left: ${FRAME_INSET}px; top: ${FRAME_INSET}px`)}
      ${corner("tr", `right: ${FRAME_INSET}px; top: ${FRAME_INSET}px`)}
      ${corner("bl", `left: ${FRAME_INSET}px; bottom: ${FRAME_INSET}px`)}
      ${corner("br", `right: ${FRAME_INSET}px; bottom: ${FRAME_INSET}px`)}
    </div>`;

  const { ImageResponse } = await import("workers-og");
  const image = new ImageResponse(html, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loadFonts(),
  });

  const response = new Response(image.body, image);
  response.headers.set("Cache-Control", CACHE_CONTROL);
  await cache.put(request.url, response.clone());
  return response;
}

export const Route = createFileRoute("/og/$username")({
  server: {
    handlers: {
      GET: generateOgImage,
    },
  },
});
