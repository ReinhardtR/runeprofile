import { Database, lower } from "@runeprofile/db";
import { AccountTypes } from "@runeprofile/runescape";

import { escapeLikePattern } from "~/lib/helpers";

export async function searchProfiles(db: Database, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const profiles = await db.query.accounts.findMany({
    columns: { username: true, accountType: true },
    where: (accounts, { like }) =>
      like(lower(accounts.username), `${escapeLikePattern(term)}%`),
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
