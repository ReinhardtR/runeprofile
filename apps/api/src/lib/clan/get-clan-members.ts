import { SQL, and, asc, count, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import { AccountTypes } from "@runeprofile/runescape";

import {
  CursorPaginationParams,
  encodeCursor,
  getCursorPaginationValues,
} from "~/lib/helpers";

export async function getClanMembersWithPagination(
  db: Database,
  clanName: string,
  filters?: CursorPaginationParams,
) {
  const { cursor, direction, limit } = getCursorPaginationValues(filters);

  // Fetch limit + 1 to determine if there are more results
  const fetchLimit = limit + 1;

  const clanCondition = eq(lower(accounts.clanName), clanName.toLowerCase());

  // Add cursor condition based on direction
  // Order is: clanRank DESC, username ASC (case-insensitive)
  let cursorCondition: SQL | undefined;
  if (cursor && cursor.clanRank !== undefined && cursor.username) {
    const cursorUsername = cursor.username.toLowerCase();
    const cursorRank = parseInt(cursor.clanRank, 10);

    if (direction === "next") {
      // For next page: (rank < cursor_rank) OR (rank = cursor_rank AND username > cursor_username)
      cursorCondition = or(
        lt(accounts.clanRank, cursorRank),
        and(
          eq(accounts.clanRank, cursorRank),
          gt(lower(accounts.username), cursorUsername),
        ),
      );
    } else {
      // For prev page: (rank > cursor_rank) OR (rank = cursor_rank AND username < cursor_username)
      cursorCondition = or(
        gt(accounts.clanRank, cursorRank),
        and(
          eq(accounts.clanRank, cursorRank),
          lt(lower(accounts.username), cursorUsername),
        ),
      );
    }
  }

  const whereCondition = cursorCondition
    ? and(clanCondition, cursorCondition)
    : clanCondition;

  // Build the query with appropriate ordering
  const membersQuery = db
    .select({
      accountType: accounts.accountType,
      username: accounts.username,
      clanName: accounts.clanName,
      clanRank: accounts.clanRank,
      clanIcon: accounts.clanIcon,
      clanTitle: accounts.clanTitle,
    })
    .from(accounts)
    .where(whereCondition)
    .orderBy(
      direction === "prev" ? asc(accounts.clanRank) : desc(accounts.clanRank),
      direction === "prev"
        ? desc(lower(accounts.username))
        : asc(lower(accounts.username)),
    )
    .limit(fetchLimit);

  const totalMembersQuery = db
    .select({
      count: count(accounts.username),
    })
    .from(accounts)
    .where(clanCondition);

  const [fetchedMembers, totalMembers] = await Promise.all([
    membersQuery,
    totalMembersQuery,
  ]);

  let filteredMembers = fetchedMembers;

  // If going backwards, reverse the results to maintain original order
  if (direction === "prev") {
    filteredMembers = filteredMembers.reverse();
  }

  // Determine if there are more results in the current query direction
  const hasMoreInDirection = filteredMembers.length > limit;
  if (hasMoreInDirection) {
    filteredMembers = filteredMembers.slice(0, limit);
  }

  // Determine cursors
  const firstItem = filteredMembers[0];
  const lastItem = filteredMembers[filteredMembers.length - 1];

  const hasPrev =
    direction === "next" ? cursor !== undefined : hasMoreInDirection;
  const hasMore =
    direction === "next" ? hasMoreInDirection : cursor !== undefined;

  const nextCursor =
    hasMore && lastItem
      ? encodeCursor({
          clanRank: String(lastItem.clanRank!),
          username: lastItem.username,
        })
      : null;

  const prevCursor =
    hasPrev && firstItem
      ? encodeCursor({
          clanRank: String(firstItem.clanRank!),
          username: firstItem.username,
        })
      : null;

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
    total: totalMembers[0]?.count || 0,
    members: formattedMembers,
    nextCursor,
    prevCursor,
    hasMore,
    hasPrev,
  };
}
