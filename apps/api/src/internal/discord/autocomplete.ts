import { Autocomplete, AutocompleteContext } from "discord-hono";
import { and, isNotNull, like } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";

export async function getRsnAutocomplete(
  db: Database,
  focused: AutocompleteContext["focused"],
) {
  const query = focused?.value.toString();
  if (!query) return new Autocomplete();

  const players = await db.query.accounts.findMany({
    columns: { username: true, accountType: true },
    where: (accounts, { like }) =>
      like(lower(accounts.username), `${query.toLowerCase()}%`),
    orderBy: (accounts, { asc }) => [asc(lower(accounts.username))],
    limit: 10,
  });

  const options = players.map((p) => ({
    name: p.username,
    value: p.username,
  }));

  return new Autocomplete().choices(...options);
}

export async function getClanAutocomplete(
  db: Database,
  focused: AutocompleteContext["focused"],
) {
  const query = focused?.value.toString();
  if (!query) return new Autocomplete();

  const clans = await db
    .selectDistinct({ clanName: accounts.clanName })
    .from(accounts)
    .where(
      and(
        isNotNull(accounts.clanName),
        like(lower(accounts.clanName), `${query.toLowerCase()}%`),
      ),
    )
    .orderBy(lower(accounts.clanName))
    .limit(10);

  const options = clans.map((c) => ({
    name: c.clanName!,
    value: c.clanName!,
  }));

  return new Autocomplete().choices(...options);
}
