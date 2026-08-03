import {
  parseModel,
  renderScene,
  encodePng,
} from "@runeprofile/model-rasterizer";
import {
  AccountType,
  ActivityEvent,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTaskByIndex,
  getCombatAchievementTierName,
  getQuestById,
  getQuestDifficultyName,
} from "@runeprofile/runescape";

import CardAssets from "~/internal/discord/cards/card-assets.json";
import {
  getItemIconUrl,
  getItemName,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/internal/discord/helpers";

// Cards are authored at 720x240 and rendered at 2x so Discord shows them
// crisp on high-DPI screens.
const S = 2;
export const CARD_WIDTH = 720 * S;
export const CARD_HEIGHT = 240 * S;

const png = (base64: string) => `data:image/png;base64,${base64}`;

// ---------------------------------------------------------------- avatar

/**
 * Chest-up portrait of the player's model straight from R2, framed on the
 * body with the standard chathead angle and the soft partial bottom fade.
 * Falls back to the default player model when none is uploaded.
 */
export async function renderAvatarDataUri(
  bucket: R2Bucket,
  rsn: string,
): Promise<string> {
  let bytes: Uint8Array;
  try {
    const file = await bucket.get(rsn.toLowerCase());
    if (file) {
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      bytes = base64ToBytes(CardAssets.defaultPlayerModel);
    }
  } catch {
    bytes = base64ToBytes(CardAssets.defaultPlayerModel);
  }

  const width = 200 * S;
  const height = 240 * S;
  const rgba = renderScene([{ model: parseModel(bytes), yaw: 2.49 }], {
    width,
    height,
    // Tight head-and-shoulders framing: Discord scales the card down, so
    // the model has to read at a glance. Height-only fit lets broad
    // shoulders bleed off the sides instead of shrinking the head.
    cropTop: 0.34,
    cropRef: "body",
    headroomTop: 0.1,
    fit: "height",
    supersample: 2,
    fadeBottom: 0.28,
    fadeFloor: 0.45,
  });
  return png(bytesToBase64(await encodePng(rgba, width, height)));
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

// ------------------------------------------------------------- rendering

let fonts:
  | { name: string; data: ArrayBuffer; weight: number; style: "normal" }[]
  | null = null;

function loadFonts() {
  fonts ??= [
    {
      name: "RuneScape",
      data: base64ToBytes(CardAssets.fontRegular).buffer as ArrayBuffer,
      weight: 400,
      style: "normal" as const,
    },
    {
      name: "RuneScape",
      data: base64ToBytes(CardAssets.fontBold).buffer as ArrayBuffer,
      weight: 700,
      style: "normal" as const,
    },
  ];
  return fonts;
}

/**
 * workers-og re-attempts wasm init on every render and logs the caught
 * "Already initialized" error each time. The failures are benign — this
 * silences exactly that chatter for the duration of a render.
 *
 * Note: workers-og is kept over calling modern satori directly on
 * purpose. Its bundled older satori emits far simpler SVG (no per-node
 * overflow masks), which renders ~5x faster under workerd.
 */
async function withoutInitNoise<T>(work: () => Promise<T>): Promise<T> {
  const original = console.log;
  console.log = (...args: unknown[]) => {
    if (args[0] === "init RESVG") return;
    if (
      args[0] instanceof Error &&
      args[0].message.includes("Already initialized")
    ) {
      return;
    }
    original(...args);
  };
  try {
    return await work();
  } finally {
    console.log = original;
  }
}

export async function renderActivityCardPng(params: {
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
  avatarDataUri: string;
}): Promise<Uint8Array> {
  const html = buildCardHtml(params);
  return withoutInitNoise(async () => {
    const { ImageResponse } = await import("workers-og");
    const image = new ImageResponse(html, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: loadFonts(),
    });
    return new Uint8Array(await image.arrayBuffer());
  });
}

// ---------------------------------------------------------------- layout

type CardContent = {
  /** Left edge / glow accent as [r, g, b]. */
  accent: [number, number, number];
  verb: string;
  panelIcon: string;
  panelTitle: string;
  panelSubtitle: string;
  /** Big number on the panel's right side (level, XP, tier). */
  badge?: string;
  footerLeft: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const YELLOW: [number, number, number] = [255, 255, 0];
const ORANGE: [number, number, number] = [255, 152, 31];
const GREEN: [number, number, number] = [0, 224, 0];
const BLUE: [number, number, number] = [95, 168, 255];
const PURPLE: [number, number, number] = [124, 111, 255];
const RED: [number, number, number] = [227, 69, 69];
const GOLD: [number, number, number] = [232, 179, 76];

function skillIcon(name: string): string {
  const key = name.toLowerCase() as keyof typeof CardAssets.skillIcons;
  return CardAssets.skillIcons[key]
    ? png(CardAssets.skillIcons[key])
    : png(CardAssets.logo);
}

function caTierIcon(tierId: number | undefined): string {
  const key = String(tierId ?? "") as keyof typeof CardAssets.caTierIcons;
  return CardAssets.caTierIcons[key]
    ? png(CardAssets.caTierIcons[key])
    : png(CardAssets.caIcon);
}

function buildCardContent(activity: ActivityEvent): CardContent {
  switch (activity.type) {
    case "valuable_drop": {
      const { itemId, value } = activity.data;
      return {
        accent: GREEN,
        verb: "received a valuable drop",
        panelIcon: getItemIconUrl(itemId),
        panelTitle: getItemName(itemId),
        panelSubtitle: `${numberWithDelimiter(value)} gp`,
        footerLeft: "Valuable Drop",
      };
    }
    case "new_item_obtained": {
      const { itemId } = activity.data;
      return {
        accent: ORANGE,
        verb: "filled a collection log slot",
        panelIcon: getItemIconUrl(itemId),
        panelTitle: getItemName(itemId),
        panelSubtitle: "New collection log item",
        footerLeft: "Collection Log",
      };
    }
    case "level_up": {
      const { name, level } = activity.data;
      return {
        accent: YELLOW,
        verb: "reached a new level",
        panelIcon: skillIcon(name),
        panelTitle: name,
        panelSubtitle: `Level ${level}`,
        badge: String(level),
        footerLeft: "Level Up",
      };
    }
    case "xp_milestone": {
      const { name, xp } = activity.data;
      return {
        accent: BLUE,
        verb: "hit an XP milestone",
        panelIcon: skillIcon(name),
        panelTitle: name,
        panelSubtitle: `${numberWithDelimiter(xp)} XP`,
        badge: String(numberWithAbbreviation(xp)),
        footerLeft: "XP Milestone",
      };
    }
    case "quest_completed": {
      const quest = getQuestById(activity.data.questId);
      const difficulty = quest
        ? getQuestDifficultyName(quest.difficulty)
        : undefined;
      const subtitleParts = [
        difficulty ? `${difficulty} quest` : undefined,
        quest?.points
          ? `+${quest.points} Quest Point${quest.points === 1 ? "" : "s"}`
          : undefined,
      ].filter(Boolean);
      return {
        accent: PURPLE,
        verb: "completed a quest",
        panelIcon: png(CardAssets.questIcon),
        panelTitle: quest?.name ?? "Unknown Quest",
        panelSubtitle: subtitleParts.join("  ·  ") || "Quest complete",
        footerLeft: "Quest Completed",
      };
    }
    case "achievement_diary_tier_completed": {
      const { areaId, tier } = activity.data;
      const area = getAchievementDiaryAreaName(areaId) ?? "Unknown";
      const tierName = getAchievementDiaryTierName(tier) ?? "Unknown";
      return {
        accent: GOLD,
        verb: "completed a diary tier",
        panelIcon: png(CardAssets.diaryIcon),
        panelTitle: `${area} Diary`,
        panelSubtitle: `${tierName} tier complete`,
        badge: tierName,
        footerLeft: "Achievement Diary",
      };
    }
    case "combat_achievement_tier_completed":
    case "combat_achievement_tier_reached": {
      const { tierId } = activity.data;
      const tierName = getCombatAchievementTierName(tierId) ?? "Unknown";
      const reached = activity.type === "combat_achievement_tier_reached";
      return {
        accent: RED,
        verb: reached ? "reached a new CA tier" : "completed a CA tier",
        panelIcon: caTierIcon(tierId),
        panelTitle: tierName,
        panelSubtitle: reached
          ? `Unlocked ${tierName} tier rewards`
          : `Every ${tierName} task complete`,
        footerLeft: "Combat Achievements",
      };
    }
    case "combat_achievement_task_completed": {
      const task = getCombatAchievementTaskByIndex(activity.data.taskIndex);
      const tierName = task
        ? (getCombatAchievementTierName(task.tierId) ?? "Unknown")
        : "Unknown";
      // Task descriptions can run long; keep the panel to at most two
      // subtitle lines so the card never overflows.
      const description = task?.description ?? `${tierName} task`;
      return {
        accent: RED,
        verb: "completed a combat task",
        panelIcon: caTierIcon(task?.tierId),
        panelTitle: task?.name ?? "Unknown Task",
        panelSubtitle: truncate(description, 68),
        footerLeft: `${tierName} task`,
      };
    }
    case "maxed": {
      return {
        accent: GOLD,
        verb: "achieved max total level",
        panelIcon: png(CardAssets.maxCapeIcon),
        panelTitle: "Maxed",
        panelSubtitle: "All skills 99",
        badge: "2,277",
        footerLeft: "Maxed",
      };
    }
  }
}

export function buildCardHtml(params: {
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
  avatarDataUri: string;
}): string {
  const { activity, rsn, accountType, avatarDataUri } = params;
  const content = buildCardContent(activity);
  const name = escapeHtml(rsn);
  const accountTypeIcon =
    accountType &&
    CardAssets.accountTypeIcons[
      accountType.key as keyof typeof CardAssets.accountTypeIcons
    ];

  const title = escapeHtml(content.panelTitle);
  // Long titles (quests, CA tasks) drop to a smaller size so they stay
  // on one line-ish; satori wraps if they still overflow.
  const titleSize = content.panelTitle.length > 18 ? 25 * S : 32 * S;

  const shadowSm = `text-shadow: ${2 * S}px ${2 * S}px 0 rgba(0,0,0,0.9);`;

  return `
    <div style="display: flex; position: relative; width: ${720 * S}px; height: ${240 * S}px; overflow: hidden; background-color: #0d0d0c; font-family: 'RuneScape'; border-radius: ${10 * S}px; border: ${2 * S}px solid #3b3831;">
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${720 * S}px; height: ${240 * S}px; background-image: url(${png(CardAssets.texture)}); background-repeat: repeat; background-size: ${60 * S}px ${60 * S}px; opacity: 0.85;"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${720 * S}px; height: ${240 * S}px; background-image: radial-gradient(circle at 12% 30%, ${rgba(content.accent, 0.13)} 0%, rgba(0,0,0,0) 55%);"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; width: ${720 * S}px; height: ${240 * S}px; background-image: radial-gradient(circle at 88% 85%, rgba(255,152,31,0.08) 0%, rgba(255,152,31,0) 55%);"></div>
      <div style="display: flex; position: absolute; left: 0; top: 0; bottom: 0; width: ${3 * S}px; border-radius: ${10 * S}px 0 0 ${10 * S}px; background-image: linear-gradient(to bottom, ${rgba(content.accent, 0.55)}, ${rgba(content.accent, 0.2)});"></div>

      <img src="${avatarDataUri}" width="${200 * S}" height="${240 * S}" style="position: absolute; left: ${18 * S}px; top: 0;" />

      <div style="display: flex; flex-direction: column; justify-content: center; gap: ${13 * S}px; position: absolute; left: ${236 * S}px; top: 0; bottom: 0; right: ${24 * S}px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: baseline; gap: ${10 * S}px;">
            ${
              accountTypeIcon
                ? `<img src="${png(accountTypeIcon)}" width="${26 * S}" height="${26 * S}" style="align-self: center;" />`
                : ""
            }
            <span style="font-size: ${38 * S}px; font-weight: 700; color: #ffff00; line-height: 1; ${shadowSm}">${name}</span>
            <span style="font-size: ${29 * S}px; color: #ff981f; line-height: 1; ${shadowSm}">${content.verb}</span>
          </div>
          <img src="${png(CardAssets.logo)}" width="${32 * S}" height="${32 * S}" style="align-self: center; border-radius: ${6 * S}px; opacity: 0.9;" />
        </div>

        <div style="display: flex; align-items: center; gap: ${15 * S}px; background-color: rgba(0,0,0,0.4); border-style: solid; border-width: ${2 * S}px; border-top-color: #4b473d; border-left-color: #3b3831; border-right-color: #3b3831; border-bottom-color: #24221e; border-radius: ${6 * S}px; padding: ${13 * S}px ${19 * S}px;">
          <img src="${content.panelIcon}" width="${50 * S}" height="${50 * S}" />
          <div style="display: flex; flex-direction: column; gap: ${3 * S}px; flex: 1;">
            <span style="font-size: ${titleSize}px; font-weight: 700; color: #e2e2e2; line-height: 1.05; ${shadowSm}">${title}</span>
            <span style="font-size: ${23 * S}px; color: #9f9f9f; line-height: 1.1; ${shadowSm}">${escapeHtml(content.panelSubtitle)}</span>
          </div>
          ${
            content.badge
              ? `<span style="font-size: ${52 * S}px; font-weight: 700; color: ${rgba(content.accent, 1)}; line-height: 1; ${shadowSm}">${escapeHtml(content.badge)}</span>`
              : ""
          }
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: ${22 * S}px; color: #9f9f9f; line-height: 1; ${shadowSm}">${escapeHtml(content.footerLeft)}</span>
          <span style="font-size: ${22 * S}px; color: #9f9f9f; line-height: 1; ${shadowSm}">runeprofile.com/${name}</span>
        </div>
      </div>
    </div>`;
}
