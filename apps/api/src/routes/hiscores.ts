import { cache } from "hono/cache";
import { z } from "zod";

import {
  HISCORE_LEADERBOARDS,
  HiscoreData,
  HiscoreLeaderboardKey,
} from "@runeprofile/runescape";

import { RuneProfileHiscoresError } from "~/lib/errors";
import { newRouter } from "~/lib/helpers";
import { STATUS } from "~/lib/status";
import { usernameSchema, validator } from "~/lib/validation";

export const hiscoresRouter = newRouter().get(
  "/:leaderboard/:username",
  validator(
    "param",
    z.object({
      leaderboard: z.enum(
        Object.keys(HISCORE_LEADERBOARDS) as [
          HiscoreLeaderboardKey,
          ...HiscoreLeaderboardKey[],
        ],
      ),
      username: usernameSchema,
    }),
  ),
  cache({ cacheName: "hiscores", cacheControl: "max-age=300" }),
  async (c) => {
    const { leaderboard, username } = c.req.valid("param");

    const url = `${HISCORE_LEADERBOARDS[leaderboard].url}?player=${username}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw RuneProfileHiscoresError;
    }

    const data = (await response.json()) as HiscoreData;

    return c.json(data, STATUS.OK);
  },
);
