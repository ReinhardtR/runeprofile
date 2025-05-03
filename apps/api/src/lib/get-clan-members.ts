import { asc, desc, eq } from "drizzle-orm";

import { AccountTypes } from "@runeprofile/runescape";

import { Database } from "~/db";
import { lower } from "~/db/helpers";

export async function getClanMembers(db: Database, clanName: string) {
  const members = await db.query.accounts.findMany({
    where: (accounts) => eq(lower(accounts.clanName), clanName.toLowerCase()),
    columns: {
      accountType: true,
      username: true,
      clanName: true,
      clanRank: true,
      clanIcon: true,
      clanTitle: true,
    },
    orderBy: (accounts) => [
      desc(accounts.clanRank),
      asc(lower(accounts.username)),
    ],
  });

  return members
    .filter(
      (member) =>
        !!member.clanName &&
        member.clanRank !== null &&
        member.clanIcon !== null &&
        !!member.clanTitle,
    )
    .map((member) => {
      const accountType =
        AccountTypes.find((type) => type.id === member.accountType) ||
        AccountTypes[0];

      return {
        username: member.username,
        accountType,
        clan: {
          name: member.clanName!,
          rank: member.clanRank!,
          icon: member.clanIcon!,
          title: member.clanTitle!,
        },
      };
    });
}
