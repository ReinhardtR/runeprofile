import { count, eq } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import { AccountTypes } from "@runeprofile/runescape";

import { PaginationParams, getPaginationValues } from "~/lib/helpers";

export async function getClanMembersWithPagination(
  db: Database,
  clanName: string,
  filters?: PaginationParams,
) {
  const { page, pageSize, offset } = getPaginationValues(filters);

  const clanCondition = eq(lower(accounts.clanName), clanName.toLowerCase());

  const filteredMembersQuery = db.query.accounts.findMany({
    where: clanCondition,
    columns: {
      accountType: true,
      username: true,
      clanName: true,
      clanRank: true,
      clanIcon: true,
      clanTitle: true,
    },
    orderBy: (accounts, { asc, desc }) => [
      desc(accounts.clanRank),
      asc(lower(accounts.username)),
    ],
    limit: pageSize,
    offset,
  });

  const totalMembersQuery = db
    .select({
      count: count(accounts.username),
    })
    .from(accounts)
    .where(clanCondition);

  const [filteredMembers, totalMembers] = await Promise.all([
    filteredMembersQuery,
    totalMembersQuery,
  ]);

  const formattedMembers = filteredMembers
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

  return {
    page,
    pageSize,
    total: totalMembers[0]?.count || 0,
    members: formattedMembers,
  };
}
