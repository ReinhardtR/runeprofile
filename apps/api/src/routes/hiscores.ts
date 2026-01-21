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

export const hiscoresRouter = newRouter()
  .get(
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
  )
  .post(
    "/batch",
    validator(
      "json",
      z.object({
        usernames: z.array(usernameSchema).min(1).max(10),
        leaderboard: z.enum(
          Object.keys(HISCORE_LEADERBOARDS) as [
            HiscoreLeaderboardKey,
            ...HiscoreLeaderboardKey[],
          ],
        ),
      }),
    ),
    cache({ cacheName: "batch-hiscores", cacheControl: "max-age=300" }),
    async (c) => {
      const { usernames, leaderboard } = c.req.valid("json");

      const TIMEOUT_MS = 30000;

      const fetchWithTimeout = async (
        username: string,
      ): Promise<HiscoreData | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          const url = `${HISCORE_LEADERBOARDS[leaderboard].url}?player=${username}`;
          const response = await fetch(url, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            return null;
          }

          return (await response.json()) as HiscoreData;
        } catch (error) {
          clearTimeout(timeoutId);
          return null;
        }
      };

      const results = await Promise.allSettled(
        usernames.map((username) => fetchWithTimeout(username)),
      );

      const hiscoresData: Record<string, HiscoreData | null> = {};

      usernames.forEach((username, index) => {
        const result = results[index];
        if (result) {
          hiscoresData[username] =
            result.status === "fulfilled" ? result.value : null;
        } else {
          hiscoresData[username] = null;
        }
      });

      return c.json(hiscoresData, STATUS.OK);
    },
  );
