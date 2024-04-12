import { HiscoresGameMode } from "~/lib/domain/profile-data-types";

export const GAME_MODE_DISPLAY_TEXT = {
  NORMAL: "Normal",
  IRONMAN: "Ironman",
  HARDCORE_IRONMAN: "Hardcore Ironman",
  ULTIMATE_IRONMAN: "Ultimate Ironman",
  "1_DEFENCE_PURE": "1 Defence Pure",
  LEVEL_3_SKILLER: "Level 3 Skiller",
} satisfies Record<HiscoresGameMode, string>;
