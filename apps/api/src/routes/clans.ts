import { z } from "zod";

import { drizzle } from "~/db";
import { getClanMembers } from "~/lib/get-clan-members";
import { newRouter } from "~/lib/helpers";
import { clanNameSchema, validator } from "~/lib/validation";

export const clansRouter = newRouter().get(
  "/:name",
  validator("param", z.object({ name: clanNameSchema })),
  async (c) => {
    const db = drizzle(c.env.DB);
    const { name } = c.req.valid("param");

    const members = await getClanMembers(db, name);

    return c.json({ name: members[0]?.clan.name || name, members });
  },
);
