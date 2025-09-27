import { eq } from "drizzle-orm";

import { Database, accounts } from "@runeprofile/database";

export function setDefaultClogPage(
  db: Database,
  params: {
    id: string;
    page: string;
  },
) {
  return db
    .update(accounts)
    .set({
      defaultClogPage: params.page,
    })
    .where(eq(accounts.id, params.id));
}
