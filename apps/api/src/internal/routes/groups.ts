import { cache } from "hono/cache";
import { z } from "zod";

import { drizzle } from "@runeprofile/db";

import { newRouter } from "~/lib/helpers";
import { getGroup } from "~/lib/profiles/get-group";
import { getGroupActivities } from "~/lib/profiles/get-group-activities";
import { STATUS } from "~/lib/status";
import { paginationPageSchema, validator } from "~/lib/validation";

export const groupsRouter = newRouter()
  .get(
    "/:name",
    validator("param", z.object({ name: z.string() })),
    cache({
      cacheName: "group",
      cacheControl: "public, max-age=0, s-maxage=60",
    }),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);
      const { name } = c.req.valid("param");

      const group = await getGroup(db, name);

      return c.json(group, STATUS.OK);
    },
  )
  .get(
    "/:name/activities",
    validator("param", z.object({ name: z.string() })),
    validator(
      "query",
      z.object({
        page: paginationPageSchema,
      }),
    ),
    cache({
      cacheName: "group-activities",
      cacheControl: "public, max-age=0, s-maxage=600",
    }),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);
      const { name } = c.req.valid("param");
      const { page } = c.req.valid("query");

      const result = await getGroupActivities(db, name, { page });

      return c.json(result);
    },
  );
