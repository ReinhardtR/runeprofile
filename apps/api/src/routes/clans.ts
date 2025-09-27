import { cache } from "hono/cache";
import { z } from "zod";

import { drizzle } from "@runeprofile/database";

import { getClanActivities } from "~/lib/clan/get-clan-activities";
import { getClanMembersWithPagination } from "~/lib/clan/get-clan-members";
import { newRouter } from "~/lib/helpers";
import {
  clanNameSchema,
  paginationPageSchema,
  validator,
} from "~/lib/validation";

export const clansRouter = newRouter()
  .get(
    "/:name",
    validator("param", z.object({ name: clanNameSchema })),
    validator(
      "query",
      z.object({
        page: paginationPageSchema,
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { name } = c.req.valid("param");
      const { page } = c.req.valid("query");

      const result = await getClanMembersWithPagination(db, name, {
        page,
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
        page: paginationPageSchema,
      }),
    ),
    cache({
      cacheName: "profile-model",
      cacheControl: "public, max-age=0, s-maxage=600",
    }),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { name } = c.req.valid("param");
      const { page } = c.req.valid("query");

      const result = await getClanActivities(db, name, { page });

      return c.json(result);
    },
  );
