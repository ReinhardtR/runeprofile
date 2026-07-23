import { createFileRoute } from "@tanstack/react-router";

import {
  COLLECTION_LOG_ITEM_IDS,
  SKILLS,
  getCombatLevelFromSkills,
  getLevelFromXP,
} from "@runeprofile/runescape";

import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import { RuneProfileApiError, getProfile } from "~/core/api";
// Satori needs raw TTF bytes. The fonts are inlined into the bundle as data
// URIs (a Worker can't fetch() its own hostname to load them as assets).
import runescapeBoldFont from "~/core/assets/fonts/runescape-bold.ttf?inline";
import runescapeFont from "~/core/assets/fonts/runescape.ttf?inline";

function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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
  const skills = SKILLS.map((name) => ({
    name,
    xp: profile.skills.find((s) => s.name === name)?.xp ?? 0,
  }));
  const totalLevel = skills.reduce(
    (total, skill) => total + getLevelFromXP(skill.xp),
    0,
  );
  const combatLevel = getCombatLevelFromSkills(skills);
  const obtainedCount = profile.items.length;
  const totalCount = COLLECTION_LOG_ITEM_IDS.length;

  const accountTypeIcon =
    AccountTypeIcons[profile.accountType.key as keyof typeof AccountTypeIcons];

  const stat = (label: string, value: string) => `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <span style="font-size: 34px; color: #ff981f;">${label}</span>
      <span style="font-size: 56px; font-weight: 700; color: #ffff00;">${value}</span>
    </div>`;

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const html = `
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #171717; font-family: 'RuneScape'; align-items: center; justify-content: center; gap: 48px; border: 12px solid #2e2b23;">
      <div style="display: flex; align-items: center; gap: 24px;">
        ${
          accountTypeIcon
            ? `<img src="data:image/png;base64,${accountTypeIcon}" width="56" height="56" />`
            : ""
        }
        <span style="font-size: 110px; font-weight: 700; color: #ffff00;">${escapeHtml(profile.username)}</span>
      </div>
      <div style="display: flex; gap: 110px;">
        ${stat("Total Level", String(totalLevel))}
        ${stat("Combat Level", String(combatLevel))}
        ${stat("Collection Log", `${obtainedCount} / ${totalCount}`)}
      </div>
      <span style="font-size: 38px; color: #9a9a9a;">runeprofile.com</span>
    </div>`;

  const { ImageResponse } = await import("workers-og");
  const image = new ImageResponse(html, {
    width: 1200,
    height: 630,
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
