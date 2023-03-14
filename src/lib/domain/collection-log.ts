import { db } from "~/db/client";

export async function getCollectionLogEntry({
  username,
  tabName,
  entryName,
}: {
  username: string;
  tabName?: string;
  entryName?: string;
}) {
  const account = await db
    .selectFrom("Account")
    .select(["accountHash"])
    .where("username", "=", username)
    .executeTakeFirst();

  if (!account) {
    return;
  }

  return db
    .selectFrom("Entry")
    .select(["Entry.name"])
    .where("Entry.accountHash", "=", account.accountHash)
    .$if(!!tabName, (qb) => qb.where("Entry.tabName", "=", tabName!))
    .$if(!!entryName, (qb) => qb.where("Entry.name", "=", entryName!))
    .executeTakeFirst();
}
