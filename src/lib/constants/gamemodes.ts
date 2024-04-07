import { HiscoresGameMode } from "~/lib/domain/profile-data-types";

export const GAME_MODE_DISPLAY_TEXT = {
  NORMAL: "Normal",
  IRONMAN: "Ironman",
  HARDCORE: "Hardcore Ironman",
  ULTIMATE: "Ultimate Ironman",
} satisfies Record<HiscoresGameMode, string>;
