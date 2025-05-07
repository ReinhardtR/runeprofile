import { z } from "zod";

import { drizzle } from "~/db";
import { getClanMembersWithPagination } from "~/lib/get-clan-members";
import { newRouter } from "~/lib/helpers";
import { clanNameSchema, validator } from "~/lib/validation";

export const clansRouter = newRouter().get(
  "/:name",
  validator("param", z.object({ name: clanNameSchema })),
  validator(
    "query",
    z.object({
      page: z.coerce.number().optional().catch(undefined),
      query: z.string().optional(),
    }),
  ),
  async (c) => {
    const db = drizzle(c.env.DB);
    const { name } = c.req.valid("param");
    const { page, query } = c.req.valid("query");

    const result = await getClanMembersWithPagination(db, name, {
      page,
      query,
    });

    return c.json({
      ...result,
      name: result.members[0]?.clan.name ?? name,
    });
  },
);
