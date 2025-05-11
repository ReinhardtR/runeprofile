import { AccountTypes } from "@runeprofile/runescape";

import { Database } from "~/db";
import { lower } from "~/db/helpers";

export async function searchProfiles(db: Database, query: string) {
  const profiles = await db.query.accounts.findMany({
    columns: { username: true, accountType: true },
    where: (accounts, { like }) =>
      like(lower(accounts.username), `${query.toLowerCase()}%`),
    orderBy: (accounts, { asc }) => [asc(lower(accounts.username))],
    limit: 10,
  });
  return profiles.map((profile) => ({
    username: profile.username,
    accountType:
      AccountTypes.find((type) => type.id === profile.accountType) ||
      AccountTypes[0],
  }));
}
