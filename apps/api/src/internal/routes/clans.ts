import { cache } from "hono/cache";
import { z } from "zod";

import { drizzle } from "@runeprofile/db";

import { getClanActivities } from "~/lib/clan/get-clan-activities";
import { getClanMembersWithPagination } from "~/lib/clan/get-clan-members";
import { newRouter } from "~/lib/helpers";
import {
  activityTypesSchema,
  clanNameSchema,
  cursorSchema,
  directionSchema,
  limitSchema,
  validator,
} from "~/lib/validation";

export const clansRouter = newRouter()
  .get(
    "/:name",
    validator("param", z.object({ name: clanNameSchema })),
    validator(
      "query",
      z.object({
        cursor: cursorSchema,
        direction: directionSchema,
        limit: limitSchema,
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);
      const { name } = c.req.valid("param");
      const { cursor, direction, limit } = c.req.valid("query");

      const result = await getClanMembersWithPagination(db, name, {
        cursor,
        direction,
        limit,
      });

      return c.json({
        ...result,
        name: result.members[0]?.clan.name ?? name,
      });
    },
  )
  .get(
    "/:name/activities",
    validator("param", z.object({ name: clanNameSchema })),
    validator(
      "query",
      z.object({
        cursor: cursorSchema,
        direction: directionSchema,
        limit: limitSchema,
        activityTypes: activityTypesSchema,
      }),
    ),
    cache({
      cacheName: "profile-model",
      cacheControl: "public, max-age=0, s-maxage=600",
    }),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);
      const { name } = c.req.valid("param");
      const { cursor, direction, limit, activityTypes } = c.req.valid("query");

      const result = await getClanActivities(db, name, {
        cursor,
        direction,
        limit,
        activityTypes,
      });

      return c.json(result);
    },
  );
