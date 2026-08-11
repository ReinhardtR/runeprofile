import {
  parseModel,
  renderScene,
  encodePng,
} from "@runeprofile/model-renderer/rasterizer";
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

  // The canvas spans the whole card with the head anchored over the left
  // section: weapons and banners extend across the card *behind* the
  // content panel instead of being cut at a narrow canvas edge — the only
  // hard clip left is the card border itself.
  const width = 720 * S;
  const height = 240 * S;
  const rgba = renderScene([{ model: parseModel(bytes), yaw: 2.49 }], {
    width,
    height,
    // Tight head-and-shoulders framing: Discord scales the card down, so
    // the model has to read at a glance. Height-only fit lets broad
    // shoulders bleed off instead of shrinking the head.
    cropTop: 0.32,
    cropRef: "body",
    headroomTop: 0.03,
    fit: "height",
    centerOn: "head",
    anchorX: 120 / 720,
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

/** Dev-only: renders arbitrary HTML through the same pipeline. */
export async function renderDebugHtml(html: string): Promise<Uint8Array> {
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

export async function renderActivityCardPng(params: {
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
  avatarDataUri: string;
  design?: CardDesign;
}): Promise<Uint8Array> {
  // workers-og's HTML parser keeps whitespace between tags as text nodes.
  // They render zero-width but still count as flex children, so a
  // space-between row distributes its free space around phantom gaps and
  // nothing sits flush with an edge. Collapse them away.
  const html = buildCardHtml(params).replace(/>\s+</g, "><");
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
  /** Overrides the default two-stop edge bar (pearlescent drops). */
  edgeGradient?: string;
  /** Extra full-bleed gradient painted over the background (pearl sheen). */
  sheen?: string;
  /** Colors the panel subtitle (drop values take their tier's color). */
  subtitleColor?: string;
  /** Renders the subtitle with per-character pearlescent hues. */
  subtitlePearl?: boolean;
  /**
   * The big moments — maxed, Grandmaster, 100m+ drops — get the heavier
   * background wash and an accent sheen without being asked.
   */
  flashy?: boolean;
  verb: string;
  panelIcon: string;
  panelTitle: string;
  panelSubtitle: string;
  /** Big number on the panel's right side (level, XP, tier). */
  badge?: string;
  footerLeft: string;
};

/**
 * Experimental design switches, threaded through the simulator's preview
 * endpoint so alternatives render via the real pipeline. Production sends
 * use the defaults.
 *
 * The card carries no verb text — the event is obvious from the panel,
 * and the send path puts a summary line above the image via the embed
 * description instead.
 */
export type CardDesign = {
  bg?: "wash" | "washSpot" | "washVertical" | "washDeep" | "washDeepSoft" | "washDeepStrong" | "texture";
  name?: "gold" | "white" | "accent";
  footer?: "full" | "minimal";
};

const DESIGN_DEFAULTS: Required<CardDesign> = {
  bg: "wash",
  name: "gold",
  footer: "minimal",
};

/** The line the Discord message shows above the card image. */
export function activitySummaryLine(
  activity: ActivityEvent,
  rsn: string,
): string {
  return `**${rsn}** ${buildCardContent(activity).verb}`;
}

// workers-og's parser does NOT decode entities — "&#160;" renders as
// seven literal characters — so escaping "&" would leak "&amp;" into the
// card. Only the angle brackets can break its parsing.
const escapeHtml = (value: string) =>
  value.replaceAll("<", " ").replaceAll(">", " ");

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const YELLOW: [number, number, number] = [255, 255, 0];
const ORANGE: [number, number, number] = [255, 152, 31];
const BLUE: [number, number, number] = [95, 168, 255];
const PURPLE: [number, number, number] = [124, 111, 255];
const RED: [number, number, number] = [227, 69, 69];
const GOLD: [number, number, number] = [232, 179, 76];

// Valuable drop tiers, matching the embed theme: gold at 1m+, neon pink
// at 10m+, and pearlescent at 100m+.
const DROP_GOLD: [number, number, number] = [255, 215, 0];
const DROP_PINK: [number, number, number] = [255, 0, 110];
const DROP_PEARL: [number, number, number] = [205, 190, 255];

/**
 * The pearlescent treatment — reserved for the rarest moments: 100m+
 * drops, maxing, and reaching the Grandmaster CA tier.
 */
function pearlescent(): Pick<
  CardContent,
  "accent" | "edgeGradient" | "sheen" | "flashy"
> {
  return {
    accent: DROP_PEARL,
    flashy: true,
    edgeGradient:
      "linear-gradient(to bottom, rgba(110,235,255,1), rgba(205,130,255,0.95), rgba(255,125,205,0.95), rgba(125,255,205,0.9))",
    // A diagonal iridescent sheen across the whole card — visible from
    // across the channel.
    sheen: `linear-gradient(115deg, rgba(0,0,0,0) 22%, rgba(120,225,255,0.12) 34%, rgba(210,140,255,0.13) 46%, rgba(255,150,215,0.12) 58%, rgba(140,255,215,0.10) 70%, rgba(0,0,0,0) 82%)`,
  };
}

function dropTier(value: number): Pick<
  CardContent,
  "accent" | "edgeGradient" | "subtitleColor" | "sheen" | "subtitlePearl" | "flashy"
> {
  if (value >= 100_000_000) {
    return {
      ...pearlescent(),
      subtitleColor: "#e8e2ff",
      subtitlePearl: true,
    };
  }
  if (value >= 10_000_000) {
    return { accent: DROP_PINK, subtitleColor: "#ff5ca8" };
  }
  return { accent: DROP_GOLD, subtitleColor: "#ffd700" };
}

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
        ...dropTier(value),
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
      // Reaching Grandmaster gets the pearlescent treatment. Completing
      // every task in a tier is a legacy achievement and stays plain.
      const grandmasterReached = reached && tierId >= 6;
      return {
        ...(grandmasterReached ? pearlescent() : { accent: RED }),
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
        ...pearlescent(),
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

const FULL_BLEED = `position: absolute; left: 0; top: 0; width: ${720 * S}px; height: ${240 * S}px;`;

/** Background layers, painted below the avatar and content. */
function bgLayers(content: CardContent, bg: Required<CardDesign>["bg"]): string {
  const texture = (opacity: number) =>
    `<div style="display: flex; ${FULL_BLEED} background-image: url(${png(CardAssets.texture)}); background-repeat: repeat; background-size: ${60 * S}px ${60 * S}px; opacity: ${opacity};"></div>`;
  const glow = (css: string) =>
    `<div style="display: flex; ${FULL_BLEED} background-image: ${css};"></div>`;

  switch (bg) {
    case "texture":
      // The pre-wash look, kept for reference: texture + corner glows.
      return [
        texture(0.85),
        glow(
          `radial-gradient(circle at 12% 30%, ${rgba(content.accent, 0.13)} 0%, rgba(0,0,0,0) 55%)`,
        ),
        glow(
          "radial-gradient(circle at 88% 85%, rgba(255,152,31,0.08) 0%, rgba(255,152,31,0) 55%)",
        ),
      ].join("");
    case "wash":
      // Faint texture under a diagonal accent wash that dies out mid-card.
      return [
        texture(0.5),
        glow(
          `linear-gradient(105deg, ${rgba(content.accent, 0.16)} 0%, ${rgba(content.accent, 0.05)} 30%, rgba(0,0,0,0) 55%)`,
        ),
        glow(
          "linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%)",
        ),
      ].join("");
    case "washSpot":
      // The wash plus a soft spotlight pooled behind the player.
      return [
        texture(0.5),
        glow(
          `linear-gradient(105deg, ${rgba(content.accent, 0.13)} 0%, ${rgba(content.accent, 0.04)} 30%, rgba(0,0,0,0) 55%)`,
        ),
        glow(
          `radial-gradient(circle at 16% 48%, ${rgba(content.accent, 0.16)} 0%, rgba(0,0,0,0) 45%)`,
        ),
        glow(
          "linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%)",
        ),
      ].join("");
    case "washVertical":
      // The wash falling from the top edge instead of the corner.
      return [
        texture(0.5),
        glow(
          `linear-gradient(to bottom, ${rgba(content.accent, 0.15)} 0%, ${rgba(content.accent, 0.04)} 35%, rgba(0,0,0,0) 60%)`,
        ),
        glow(
          "linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 35%)",
        ),
      ].join("");
    case "washDeepSoft":
    case "washDeep":
    case "washDeepStrong": {
      // A stronger, further-reaching wash with heavier corner shading,
      // in three intensities for comparison; washDeep is the middle.
      const [accent, reach, dark, bottom] =
        bg === "washDeepSoft"
          ? [0.19, 60, 0.38, 0.18]
          : bg === "washDeepStrong"
            ? [0.26, 70, 0.48, 0.26]
            : [0.22, 65, 0.42, 0.22];
      return [
        texture(0.55),
        glow(
          `linear-gradient(105deg, ${rgba(content.accent, accent)} 0%, ${rgba(content.accent, accent / 3)} ${Math.round(reach * 0.6)}%, rgba(0,0,0,0) ${reach}%)`,
        ),
        glow(
          `linear-gradient(to left, rgba(0,0,0,${dark}) 0%, rgba(0,0,0,0) 36%)`,
        ),
        glow(
          `linear-gradient(to top, rgba(0,0,0,${bottom}) 0%, rgba(0,0,0,0) 24%)`,
        ),
      ].join("");
    }
  }
}

export function buildCardHtml(params: {
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
  avatarDataUri: string;
  design?: CardDesign;
}): string {
  const { activity, rsn, accountType, avatarDataUri } = params;
  const content = buildCardContent(activity);
  const design = {
    ...DESIGN_DEFAULTS,
    // The big moments upgrade themselves to the heavy wash unless the
    // caller explicitly picked a background.
    ...(content.flashy ? { bg: "washDeep" as const } : {}),
    ...params.design,
  };
  const name = escapeHtml(rsn);
  const accountTypeIcon =
    accountType &&
    CardAssets.accountTypeIconsShadowed[
      accountType.key as keyof typeof CardAssets.accountTypeIconsShadowed
    ];

  const title = escapeHtml(content.panelTitle);
  // Long titles (quests, CA tasks) drop to a smaller size so they stay
  // on one line-ish; satori wraps if they still overflow.
  const titleSize = content.panelTitle.length > 18 ? 25 * S : 32 * S;

  const shadowSm = `text-shadow: ${2 * S}px ${2 * S}px 0 rgba(0,0,0,0.9);`;

  // The baked pixel shadow makes the icon read as part of the pixel-font
  // name next to it; scale from its native size so it stays sharp.
  const accountIcon = (displayHeight: number) =>
    accountTypeIcon
      ? `<img src="${png(accountTypeIcon.data)}" width="${Math.round((displayHeight * accountTypeIcon.width) / accountTypeIcon.height) * S}" height="${displayHeight * S}" style="align-self: center;" />`
      : "";

  // The header is just the player: account icon + name, logo on the far
  // right. No verb — the panel says what happened, and the Discord message
  // carries a summary line above the card.
  const nameColor =
    design.name === "white"
      ? "#f3f0e7"
      : design.name === "accent"
        ? rgba(content.accent, 1)
        : "#ffff00";
  const header = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: ${11 * S}px;">
            ${accountIcon(28)}
            <span style="font-size: ${35 * S}px; font-weight: 700; color: ${nameColor}; line-height: 1; ${shadowSm}">${name}</span>
          </div>
          <img src="${png(CardAssets.logo)}" width="${32 * S}" height="${32 * S}" style="opacity: 0.9;" />
        </div>`;

  const footer =
    design.footer === "minimal"
      ? `
        <div style="display: flex; align-items: center; justify-content: flex-end;">
          <span style="font-size: ${19 * S}px; color: #7c7c74; line-height: 1; ${shadowSm}">runeprofile.com/${name}</span>
        </div>`
      : `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: ${22 * S}px; color: #9f9f9f; line-height: 1; ${shadowSm}">${escapeHtml(content.footerLeft)}</span>
          <span style="font-size: ${22 * S}px; color: #9f9f9f; line-height: 1; ${shadowSm}">runeprofile.com/${name}</span>
        </div>`;

  const edge =
    content.edgeGradient ??
    `linear-gradient(to bottom, ${rgba(content.accent, 0.55)}, ${rgba(content.accent, 0.2)})`;

  // Flashy events sweep an accent sheen across the card even when the
  // event doesn't bring its own (pearl does).
  const sheen =
    content.sheen ??
    (content.flashy
      ? `linear-gradient(115deg, rgba(0,0,0,0) 25%, ${rgba(content.accent, 0.1)} 40%, ${rgba(content.accent, 0.14)} 52%, ${rgba(content.accent, 0.08)} 64%, rgba(0,0,0,0) 78%)`
      : undefined);

  // Pearl values shimmer: each character cycles through the pearlescent
  // hues, since a text gradient isn't in satori's vocabulary.
  const PEARL_HUES = ["#7ee7ff", "#cf8cff", "#ff8cd2", "#8cffd2"];
  const subtitleHtml = content.subtitlePearl
    ? (content.panelSubtitle.match(/\S\s*/g) ?? [])
        .map(
          // Spaces ride inside the preceding character's span - the
          // renderer collapses whitespace-only nodes entirely.
          (chunk, i) =>
            `<span style="font-size: ${23 * S}px; font-weight: 700; color: ${PEARL_HUES[i % PEARL_HUES.length]}; line-height: 1.1; ${shadowSm}">${escapeHtml(chunk)}</span>`,
        )
        .join("")
    : `<span style="font-size: ${23 * S}px; color: ${content.subtitleColor ?? "#9f9f9f"}; line-height: 1.1; ${shadowSm}">${escapeHtml(content.panelSubtitle)}</span>`;

  return `
    <div style="display: flex; position: relative; width: ${720 * S}px; height: ${240 * S}px; overflow: hidden; background-color: #0d0d0c; font-family: 'RuneScape'; border-radius: ${10 * S}px; border: ${2 * S}px solid #3b3831;">
      ${bgLayers(content, design.bg)}
      ${
        sheen
          ? `<div style="display: flex; ${FULL_BLEED} background-image: ${sheen};"></div>`
          : ""
      }

      <img src="${avatarDataUri}" width="${720 * S}" height="${240 * S}" style="position: absolute; left: 0; top: 0;" />
      <div style="display: flex; position: absolute; left: 0; top: 0; bottom: 0; width: ${3 * S}px; border-radius: ${10 * S}px 0 0 ${10 * S}px; background-image: ${edge};"></div>

      <div style="display: flex; flex-direction: column; justify-content: center; gap: ${13 * S}px; position: absolute; left: ${256 * S}px; top: 0; bottom: 0; right: ${24 * S}px;">
        ${header}

        <div style="display: flex; align-items: center; gap: ${15 * S}px; background-color: rgba(0,0,0,0.55); border-style: solid; border-width: ${2 * S}px; border-top-color: #4b473d; border-left-color: #3b3831; border-right-color: #3b3831; border-bottom-color: #24221e; border-radius: ${6 * S}px; padding: ${13 * S}px ${19 * S}px;">
          <img src="${content.panelIcon}" width="${50 * S}" height="${50 * S}" />
          <div style="display: flex; flex-direction: column; gap: ${3 * S}px; flex: 1;">
            <span style="font-size: ${titleSize}px; font-weight: 700; color: #e2e2e2; line-height: 1.05; ${shadowSm}">${title}</span>
            <div style="display: flex;">${subtitleHtml}</div>
          </div>
          ${
            content.badge
              ? `<span style="font-size: ${52 * S}px; font-weight: 700; color: ${rgba(content.accent, 1)}; line-height: 1; ${shadowSm}">${escapeHtml(content.badge)}</span>`
              : ""
          }
        </div>

        ${footer}
      </div>
    </div>`;
}
