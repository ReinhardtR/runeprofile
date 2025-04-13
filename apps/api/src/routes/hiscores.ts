import { cache } from "hono/cache";
import { z } from "zod";

import {
  HISCORE_LEADERBOARDS,
  HiscoreData,
  HiscoreLeaderboardKey,
} from "@runeprofile/runescape";

import { STATUS, newRouter } from "~/lib/helpers";
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
      return c.json(
        { error: "Failed to fetch hiscore data" },
        STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const data = (await response.json()) as HiscoreData;

    return c.json(data, STATUS.OK);
  },
);
