import { asc, like } from "drizzle-orm";

import { AccountTypes } from "@runeprofile/runescape";

import { Database } from "~/db";

export async function searchProfiles(db: Database, query: string) {
  const profiles = await db.query.accounts.findMany({
    columns: { username: true, accountType: true },
    where: (accounts) => like(accounts.username, `${query}%`),
    orderBy: (accounts) => [asc(accounts.username)],
    limit: 10,
  });
  return profiles.map((profile) => ({
    username: profile.username,
    accountType:
      AccountTypes.find((type) => type.id === profile.accountType) ||
      AccountTypes[0],
  }));
}
