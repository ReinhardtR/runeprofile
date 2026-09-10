import { sql } from "drizzle-orm";

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
    // `~<~` is text_pattern_ops' less-than; only an ORDER BY in that operator
    // family lets accounts_username_pattern_index serve the sort as well as
    // the prefix match.
    orderBy: (accounts) => [sql`${lower(accounts.username)} using ~<~`],
    limit: 10,
  });
  return profiles.map((profile) => ({
    username: profile.username,
    accountType:
      AccountTypes.find((type) => type.id === profile.accountType) ||
      AccountTypes[0],
  }));
}
