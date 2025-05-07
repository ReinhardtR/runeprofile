import { and, count, eq, like } from "drizzle-orm";

import { AccountTypes } from "@runeprofile/runescape";

import { Database, accounts } from "~/db";
import { lower } from "~/db/helpers";

const defaultPageSize = 10;
const defaultPage = 1;

export async function getClanMembersWithPagination(
  db: Database,
  clanName: string,
  pagination?: {
    query?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = Math.max(defaultPage, pagination?.page || defaultPage);
  const pageSize = pagination?.pageSize || defaultPageSize;
  const offset = (page - 1) * pageSize;

  const clanCondition = eq(lower(accounts.clanName), clanName.toLowerCase());
  const filteredCondition = !!pagination?.query
    ? and(clanCondition, like(lower(accounts.username), `${pagination.query}%`))
    : clanCondition;

  const filteredMembersQuery = db.query.accounts.findMany({
    where: filteredCondition,
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

  const totalFilteredMembersQuery = db
    .select({
      count: count(accounts.username),
    })
    .from(accounts)
    .where(filteredCondition);

  const totalMembersQuery = db
    .select({
      count: count(accounts.username),
    })
    .from(accounts)
    .where(clanCondition);

  const [filteredMembers, totalFilteredMembers, totalMembers] =
    await Promise.all([
      filteredMembersQuery,
      totalFilteredMembersQuery,
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
    memberCount: totalFilteredMembers[0]?.count || 0,
  };
}
