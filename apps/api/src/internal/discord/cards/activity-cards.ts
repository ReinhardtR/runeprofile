import {
  encodePng,
  parseModel,
  renderScene,
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
  initFontMetrics,
  measureText,
} from "~/internal/discord/cards/font-metrics";
import {
  getItemIconUrl,
  getItemName,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/internal/discord/helpers";

/**
 * The card is laid out on a 720-unit-wide grid and every size in the
 * markup is a multiple of the render scale, so one number sets the output
 * resolution without touching the design.
 */
const CARD_AUTHORED_WIDTH = 720;

/**
 * Native size of one tile of the stone texture, and the only sizes it may
 * be drawn at.
 *
 * A tile has to land on whole pixels or its edges show up as a grid: the
 * texture wraps seamlessly, but only if adjacent copies meet exactly. At
 * the old 1440px card the tile happened to come out at 120px — a clean 2x —
 * and the seams were invisible. At 800px the same formula gives 66.67px,
 * every edge falls mid-pixel, and the grid appears.
 *
 * Rounding the scale keeps the grain about the same relative to the card,
 * because card width and tile size fall together.
 */
const TEXTURE_NATIVE = 60;

/**
 * Render scale the account type icons are baked for. They are pixel art
 * upscaled with nearest-neighbour and given their rim and shadow in output
 * space, so the baked pixels only line up 1:1 at this scale.
 */
const ACCOUNT_ICON_BAKE_SCALE = 2;

const textureTile = () => TEXTURE_NATIVE * Math.max(1, Math.round(S));

/**
 * Authored card height, in grid units. The aspect ratio is what decides
 * how much of a channel a card takes up at a given width.
 */
const CARD_AUTHORED_HEIGHT = 208;

/**
 * Output width in pixels.
 *
 * Discord sizes an image from its own pixel width and scales it down only
 * when it would overflow whatever column it sits in, so size and sharpness
 * are the same number and a card can only be crisp where something else
 * imposes the limit. Cards ship inside an embed for exactly that reason:
 * the embed's image column is far narrower than the message, so a file at
 * roughly twice the displayed width is scaled down to fit and lands around
 * two device pixels per image pixel on a high-DPI screen. Sending a small
 * file instead would be displayed small at 1:1 and then stretched by the
 * display, which is what made 500px look soft.
 *
 * It also means nothing here needs to rasterise above the output size: the
 * embed column's own downscale is the same area-average a supersampling
 * pass would do, for free. Beyond about twice the displayed width the
 * extra pixels are simply thrown away, and they are not free — render cost
 * tracks the pixels rasterised almost exactly.
 */
const CARD_WIDTH = 800;
const CARD_HEIGHT = Math.round(
  (CARD_AUTHORED_HEIGHT * CARD_WIDTH) / CARD_AUTHORED_WIDTH,
);

/**
 * The scale the layout is authored against, so one number drives every
 * size in the markup.
 */
const S = CARD_WIDTH / CARD_AUTHORED_WIDTH;

/**
 * Where the three rows sit, in authored units.
 *
 * The header and footer are placed against the card rather than sharing a
 * centred column with the panel, so a tall panel can never push the
 * player's name off the top or the profile link off the bottom - it is
 * bounded by the band between them instead.
 *
 * The band is deep enough for a two-line title over a one-line subtitle,
 * which is what the longest CA task and quest names need.
 */
const HEADER_TOP = 14;
const FOOTER_BOTTOM = 14;
const BAND_TOP = 53;
const BAND_HEIGHT = 118;

/**
 * Width the panel has for its contents: the content column, less the
 * card's own borders, the panel's border and its padding.
 *
 * satori positions an absolute child against the border box but sizes it
 * inside the padding box, so the card's 2-unit borders come off the column
 * width as well - which is why this is 394 and not 398.
 */
const PANEL_INNER = 440 - 2 * 2 - 2 * 2 - 2 * 19;

/** A unit of slack, so a string measured to the edge does not wrap. */
const FIT_SLACK = 2;

/** Sizes the title may be set at, largest first. */
const TITLE_SIZES = [32, 29, 26, 23, 21];
const MIN_TITLE_SIZE = 21;

const SUBTITLE_SIZE = 23;
const TITLE_LINE_HEIGHT = 1.05;
const SUBTITLE_LINE_HEIGHT = 1.1;

/** Panel padding and border, vertically. */
const PANEL_CHROME = 13 * 2 + 2 * 2;

/**
 * Width left for the title and subtitle once the icon tile, the row gaps
 * and anything on the right are paid for.
 */
function textColumnWidth(rightWidth: number): number {
  const gaps = rightWidth > 0 ? 15 * 2 : 15;
  return PANEL_INNER - 64 - gaps - rightWidth - FIT_SLACK;
}

/** Largest title size whose two lines still fit the band with a subtitle. */
const TWO_LINE_MAX_SIZE = Math.floor(
  (BAND_HEIGHT - PANEL_CHROME - SUBTITLE_SIZE * SUBTITLE_LINE_HEIGHT - 3) /
    (2 * TITLE_LINE_HEIGHT),
);

/** Cuts a string down until it fits, marking the cut with an ellipsis. */
function ellipsize(
  text: string,
  weight: "regular" | "bold",
  size: number,
  available: number,
): string {
  if (measureText(text, weight, size) <= available) return text;
  let out = text;
  while (out.length > 1 && measureText(`${out}...`, weight, size) > available) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}...`;
}

/**
 * Fits the title to the column: the largest size that holds it on one
 * line, or failing that two lines at a size the band can take, and only
 * as a last resort an ellipsis.
 *
 * One line is preferred while the size is still respectable rather than
 * jumping straight to two at full size, because the card is read at a
 * glance in a channel and a single line scans faster. Wrapping is only
 * offered when nothing sits to the right of the text: sharing the row with
 * a value leaves a column too narrow for two lines to read as one title.
 */
function fitTitle(title: string, available: number, mayWrap: boolean) {
  for (const size of TITLE_SIZES) {
    if (measureText(title, "bold", size) <= available) return { title, size };
  }

  if (mayWrap) {
    for (const size of TITLE_SIZES) {
      if (size > TWO_LINE_MAX_SIZE) continue;
      // Word wrapping cannot fill both lines to the edge, so only claim
      // most of the second line.
      if (measureText(title, "bold", size) <= available * 1.9) {
        return { title, size };
      }
    }
  }

  return {
    title: ellipsize(title, "bold", MIN_TITLE_SIZE, available),
    size: MIN_TITLE_SIZE,
  };
}

const png = (base64: string) => `data:image/png;base64,${base64}`;

// ---------------------------------------------------------------- avatar

/**
 * How much of the model is kept above the crop: head, shoulders and a
 * little chest, with the rest cut off by the bottom of the card. Discord
 * scales the card down, so the head has to read at a glance, and a
 * height-only fit lets broad shoulders bleed off the sides rather than
 * shrinking the head to fit them in.
 *
 * Left as a product: 0.32 was tuned when the card was 240 units tall, and
 * rounding the result to a decimal shifts the framing by a fraction of a
 * pixel.
 */
const MODEL_CROP_TOP = 0.32 * (CARD_AUTHORED_HEIGHT / 240);

/**
 * Chest-up portrait of the player's model straight from R2, framed on the
 * body with the standard chathead angle. The crop is left hard: it is
 * clipped by the card border, and fading it out only made it look hazy.
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
  const rgba = renderScene([{ model: parseModel(bytes), yaw: 2.49 }], {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    cropTop: MODEL_CROP_TOP,
    cropRef: "body",
    headroomTop: 0.03,
    fit: "height",
    centerOn: "head",
    anchorX: 120 / 720,
    // Anti-aliasing the polygon edges matters at the size the card is
    // shown, not the size it is drawn: a large file gets scaled down by
    // Discord, which smooths them for free. This overrides the renderer's
    // default of 2 — four times the pixels for nothing visible here.
    supersample: 1,
  });
  return png(bytesToBase64(await encodePng(rgba, CARD_WIDTH, CARD_HEIGHT)));
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
  if (!fonts) {
    initFontMetrics({
      regular: base64ToBytes(CardAssets.fontRegular),
      bold: base64ToBytes(CardAssets.fontBold),
    });
  }
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
  /** Curated tint for the player's name, in place of the raw accent. */
  nameColor?: string;
  /** Renders the name with per-character pearlescent hues. */
  namePearl?: boolean;
  /**
   * The big moments — maxed, Grandmaster, 100m+ drops — get the heavier
   * background wash and an accent sheen without being asked.
   */
  flashy?: boolean;
  verb: string;
  panelIcon: string;
  panelTitle: string;
  panelSubtitle: string;
  /**
   * Big number on the panel's right side: a level, an XP total, a total
   * level. Numbers only - a word here (a diary or CA tier) takes so much
   * of the row that the title has to wrap, and it only repeats what the
   * title or the subtitle already says.
   */
  badge?: string;
};

/**
 * The content panel's fill, with a matching hairline border.
 *
 * Near-opaque on purpose: the model passes behind the panel, and anything
 * more translucent lets a weapon or a bright pauldron show through the
 * text. It matches the 70% black the OG images use for their stat chips.
 */
const PANEL_FILL = "rgba(0,0,0,0.7)";
const PANEL_BORDER = "rgba(255,255,255,0.06)";

/**
 * Alt text for the card image. Everything the card says is drawn into a
 * PNG, so this is the only form a screen reader — or anyone with images
 * turned off — can read. Plain text, not markdown: Discord shows it as a
 * description rather than rendering it.
 */
export function activityAltText(activity: ActivityEvent, rsn: string): string {
  return `${rsn} ${buildCardContent(activity).verb}`;
}

// workers-og's parser does NOT decode entities — "&#160;" renders as
// seven literal characters — so escaping "&" would leak "&amp;" into the
// card. Only the angle brackets can break its parsing.
const escapeHtml = (value: string) =>
  value.replaceAll("<", " ").replaceAll(">", " ");

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

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
  "accent" | "edgeGradient" | "sheen" | "flashy" | "nameColor" | "namePearl"
> {
  return {
    accent: DROP_PEARL,
    nameColor: "#e8e2ff",
    namePearl: true,
    flashy: true,
    edgeGradient:
      "linear-gradient(to bottom, rgba(110,235,255,1), rgba(205,130,255,0.95), rgba(255,125,205,0.95), rgba(125,255,205,0.9))",
    // A diagonal iridescent sheen across the whole card — visible from
    // across the channel.
    sheen: `linear-gradient(115deg, rgba(0,0,0,0) 22%, rgba(120,225,255,0.12) 34%, rgba(210,140,255,0.13) 46%, rgba(255,150,215,0.12) 58%, rgba(140,255,215,0.10) 70%, rgba(0,0,0,0) 82%)`,
  };
}

function dropTier(
  value: number,
): Pick<
  CardContent,
  | "accent"
  | "edgeGradient"
  | "subtitleColor"
  | "sheen"
  | "subtitlePearl"
  | "flashy"
  | "nameColor"
  | "namePearl"
> {
  if (value >= 100_000_000) {
    return {
      ...pearlescent(),
      subtitleColor: "#e8e2ff",
      subtitlePearl: true,
    };
  }
  if (value >= 10_000_000) {
    return {
      accent: DROP_PINK,
      subtitleColor: "#ff5ca8",
      nameColor: "#ff6eb2",
    };
  }
  return { accent: DROP_GOLD, subtitleColor: "#ffd700", nameColor: "#ffd700" };
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
      };
    }
    case "new_item_obtained": {
      const { itemId } = activity.data;
      return {
        accent: ORANGE,
        nameColor: "#ffb84d",
        verb: "filled a collection log slot",
        panelIcon: getItemIconUrl(itemId),
        panelTitle: getItemName(itemId),
        panelSubtitle: "New collection log item",
      };
    }
    case "level_up": {
      const { name, level } = activity.data;
      return {
        accent: YELLOW,
        nameColor: "#ffff00",
        verb: "reached a new level",
        panelIcon: skillIcon(name),
        panelTitle: name,
        panelSubtitle: `Level ${level}`,
        badge: String(level),
      };
    }
    case "xp_milestone": {
      const { name, xp } = activity.data;
      // 200m is the XP cap — hitting it joins the pearlescent club.
      const capped = xp >= 200_000_000;
      return {
        ...(capped
          ? { ...pearlescent(), subtitlePearl: true, subtitleColor: "#e8e2ff" }
          : { accent: BLUE, nameColor: "#8cc3ff" }),
        verb: capped ? "maxed a skill's XP" : "hit an XP milestone",
        panelIcon: skillIcon(name),
        panelTitle: name,
        panelSubtitle: `${numberWithDelimiter(xp)} XP`,
        badge: String(numberWithAbbreviation(xp)),
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
        nameColor: "#b3a8ff",
        verb: "completed a quest",
        panelIcon: png(CardAssets.questIcon),
        panelTitle: quest?.name ?? "Unknown Quest",
        panelSubtitle: subtitleParts.join("  ·  ") || "Quest complete",
      };
    }
    case "achievement_diary_tier_completed": {
      const { areaId, tier } = activity.data;
      const area = getAchievementDiaryAreaName(areaId) ?? "Unknown";
      const tierName = getAchievementDiaryTierName(tier) ?? "Unknown";
      return {
        accent: GOLD,
        nameColor: "#f2ce63",
        verb: "completed a diary tier",
        panelIcon: png(CardAssets.diaryIcon),
        // The tier rides in the title and "Diary" comes off it, because
        // the subtitle says that already. As a badge the tier word was
        // wide enough ("Medium" alone takes 156 of the 304 units the row
        // had) to squeeze the title into wrapping.
        panelTitle: `${area} ${tierName}`,
        panelSubtitle: "Achievement Diary",
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
        ...(grandmasterReached
          ? pearlescent()
          : { accent: RED, nameColor: "#ff8578" }),
        verb: reached ? "reached a new CA tier" : "completed a CA tier",
        panelIcon: caTierIcon(tierId),
        panelTitle: tierName,
        panelSubtitle: reached
          ? `Unlocked ${tierName} tier rewards`
          : `Every ${tierName} task complete`,
      };
    }
    case "combat_achievement_task_completed": {
      const task = getCombatAchievementTaskByIndex(activity.data.taskIndex);
      const tierName = task
        ? (getCombatAchievementTierName(task.tierId) ?? "Unknown")
        : "Unknown";
      // No description on the card — they're usually paragraph-length.
      return {
        accent: RED,
        nameColor: "#ff8578",
        verb: "completed a combat task",
        panelIcon: caTierIcon(task?.tierId),
        panelTitle: task?.name ?? "Unknown Task",
        panelSubtitle: `${tierName} task`,
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
      };
    }
  }
}

const fullBleed = (width: number, height: number) =>
  `position: absolute; left: 0; top: 0; width: ${width}px; height: ${height}px;`;

/**
 * Background layers, painted below the avatar and content: a faint stone
 * texture under a diagonal accent wash that dies out before it reaches the
 * panel, with the far edge shaded down.
 *
 * Flashy events — maxed, Grandmaster, 100m+ drops — get a stronger wash
 * that reaches further across the card, plus heavier corner shading.
 */
function bgLayers(content: CardContent): string {
  const FULL_BLEED = fullBleed(CARD_WIDTH, CARD_HEIGHT);
  const texture = (opacity: number) =>
    `<div style="display: flex; ${FULL_BLEED} background-image: url(${png(CardAssets.texture)}); background-repeat: repeat; background-size: ${textureTile()}px ${textureTile()}px; opacity: ${opacity};"></div>`;
  const glow = (css: string) =>
    `<div style="display: flex; ${FULL_BLEED} background-image: ${css};"></div>`;

  if (content.flashy) {
    return [
      texture(0.55),
      glow(
        `linear-gradient(105deg, ${rgba(content.accent, 0.22)} 0%, ${rgba(content.accent, 0.22 / 3)} 39%, rgba(0,0,0,0) 65%)`,
      ),
      glow("linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 36%)"),
      glow("linear-gradient(to top, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 24%)"),
    ].join("");
  }

  return [
    texture(0.5),
    glow(
      `linear-gradient(105deg, ${rgba(content.accent, 0.16)} 0%, ${rgba(content.accent, 0.05)} 30%, rgba(0,0,0,0) 55%)`,
    ),
    glow("linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%)"),
  ].join("");
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
    CardAssets.accountTypeIconsShadowed[
      accountType.key as keyof typeof CardAssets.accountTypeIconsShadowed
    ];

  // The right-hand value is resolved first, because what it leaves is the
  // width everything else has to be fitted into.
  const badgeWidth = content.badge ? measureText(content.badge, "bold", 52) : 0;
  const available = textColumnWidth(badgeWidth);

  // A title may take a second line only when nothing shares its row: CA
  // task and quest names run past 40 characters, and reading them in full
  // beats truncating them.
  const fitted = fitTitle(content.panelTitle, available, !content.badge);
  const title = escapeHtml(fitted.title);
  const titleSize = fitted.size * S;
  const subtitle = ellipsize(
    content.panelSubtitle,
    content.subtitlePearl ? "bold" : "regular",
    SUBTITLE_SIZE,
    available,
  );

  const shadowSm = `text-shadow: ${2 * S}px ${2 * S}px 0 rgba(0,0,0,0.9);`;
  // The name gets the same treatment as the account icon beside it: a
  // black rim on every side plus the drop shadow, so it stays legible
  // wherever the model or a wash sits behind it.
  const shadowName = `text-shadow: ${S}px 0 0 #000, -${S}px 0 0 #000, 0 ${S}px 0 #000, 0 -${S}px 0 #000, ${2 * S}px ${2 * S}px 0 rgba(0,0,0,0.9);`;

  // Baked rim light + pixel shadow make the icon tactile on the dark card.
  // The asset is baked for a 1:1 blit at ACCOUNT_ICON_BAKE_SCALE, so its
  // pixel size has to be divided back out and re-scaled: drawn at its own
  // dimensions it keeps that size while the type beside it scales, which on
  // an 800px card left it half again too tall for the name.
  const accountIcon = () => {
    if (!accountTypeIcon) return "";
    const scale = S / ACCOUNT_ICON_BAKE_SCALE;
    const width = Math.round(accountTypeIcon.width * scale);
    const height = Math.round(accountTypeIcon.height * scale);
    return `<img src="${png(accountTypeIcon.data)}" width="${width}" height="${height}" style="align-self: center;" />`;
  };

  // The header is just the player: account icon + name, logo on the far
  // right. No verb — the panel says what happened, and the alt text on the
  // attachment carries a summary for anyone who can't see the image.
  //
  // The name takes the event's curated tint rather than the raw accent:
  // some accents are too dark against the card to read as a name.
  const nameColor = content.nameColor ?? rgba(content.accent, 1);
  const PEARL_NAME_HUES = ["#a5ecff", "#dcb8ff", "#ffb8e0", "#b8ffdf"];
  const nameHtml = content.namePearl
    ? `<div style="display: flex;">${(name.match(/\S\s*/g) ?? [])
        .map(
          // As with the subtitle: preserve the spaces, or a two-word name
          // renders as one.
          (chunk, i) =>
            `<span style="font-size: ${35 * S}px; font-weight: 700; color: ${PEARL_NAME_HUES[i % PEARL_NAME_HUES.length]}; line-height: 1; white-space: pre; ${shadowName}">${chunk}</span>`,
        )
        .join("")}</div>`
    : `<span style="font-size: ${35 * S}px; font-weight: 700; color: ${nameColor}; line-height: 1; ${shadowName}">${name}</span>`;
  const header = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: ${11 * S}px;">
            ${accountIcon()}
            ${nameHtml}
          </div>
          <img src="${png(CardAssets.logo)}" width="${32 * S}" height="${32 * S}" style="opacity: 0.9;" />
        </div>`;

  // Just the profile link, right-aligned under the panel. Naming the event
  // type on the left was redundant with the panel above it.
  const footer = `
        <div style="display: flex; align-items: center; justify-content: flex-end;">
          <span style="font-size: ${19 * S}px; color: #8b8b82; line-height: 1; ${shadowName}">runeprofile.com/${name}</span>
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
    ? (subtitle.match(/\S\s*/g) ?? [])
        .map(
          // Spaces ride inside the preceding character's span, since a
          // whitespace-only node is collapsed away entirely - and the span
          // has to preserve them, or the trailing space is trimmed and the
          // words run together ("200,000,000XP").
          (chunk, i) =>
            `<span style="font-size: ${SUBTITLE_SIZE * S}px; font-weight: 700; color: ${PEARL_HUES[i % PEARL_HUES.length]}; line-height: ${SUBTITLE_LINE_HEIGHT}; white-space: pre; ${shadowSm}">${escapeHtml(chunk)}</span>`,
        )
        .join("")
    : `<span style="font-size: ${SUBTITLE_SIZE * S}px; color: ${content.subtitleColor ?? "#9f9f9f"}; line-height: ${SUBTITLE_LINE_HEIGHT}; ${shadowSm}">${escapeHtml(subtitle)}</span>`;

  return `
    <div style="display: flex; position: relative; width: ${CARD_WIDTH}px; height: ${CARD_HEIGHT}px; overflow: hidden; background-color: #0d0d0c; font-family: 'RuneScape'; border-radius: ${10 * S}px; border: ${2 * S}px solid #3b3831;">
      ${bgLayers(content)}
      ${
        sheen
          ? `<div style="display: flex; ${fullBleed(CARD_WIDTH, CARD_HEIGHT)} background-image: ${sheen};"></div>`
          : ""
      }

      <img src="${avatarDataUri}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" style="position: absolute; left: 0; top: 0;" />
      <div style="display: flex; position: absolute; left: 0; top: 0; bottom: 0; width: ${3 * S}px; border-radius: ${10 * S}px 0 0 ${10 * S}px; background-image: ${edge};"></div>

      <div style="display: flex; position: absolute; left: ${256 * S}px; top: 0; bottom: 0; right: ${24 * S}px;">
        <div style="display: flex; flex-direction: column; position: absolute; left: 0; right: 0; top: ${HEADER_TOP * S}px;">
          ${header}
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden; position: absolute; left: 0; right: 0; top: ${BAND_TOP * S}px; height: ${BAND_HEIGHT * S}px;">
          <div style="display: flex; align-items: center; gap: ${15 * S}px; background-color: ${PANEL_FILL}; border-style: solid; border-width: ${2 * S}px; border-color: ${PANEL_BORDER}; border-radius: ${6 * S}px; padding: ${13 * S}px ${19 * S}px;">
            <div style="display: flex; align-items: center; justify-content: center; width: ${64 * S}px; height: ${64 * S}px; background-color: rgba(255,255,255,0.08); border-radius: ${6 * S}px; border: ${1 * S}px solid rgba(255,255,255,0.06);">
              <img src="${content.panelIcon}" width="${48 * S}" height="${48 * S}" />
            </div>
            <div style="display: flex; flex-direction: column; gap: ${3 * S}px; flex: 1;">
              <span style="font-size: ${titleSize}px; font-weight: 700; color: #e2e2e2; line-height: ${TITLE_LINE_HEIGHT}; ${shadowSm}">${title}</span>
              <div style="display: flex;">${subtitleHtml}</div>
            </div>
            ${
              content.badge
                ? `<span style="font-size: ${52 * S}px; font-weight: 700; color: ${rgba(content.accent, 1)}; line-height: 1; ${shadowSm}">${escapeHtml(content.badge)}</span>`
                : ""
            }
          </div>
        </div>

        <div style="display: flex; flex-direction: column; position: absolute; left: 0; right: 0; bottom: ${FOOTER_BOTTOM * S}px;">
          ${footer}
        </div>
      </div>
    </div>`;
}
