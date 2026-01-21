import { asc, eq } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import { AccountTypes, COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

import { RuneProfileAccountNotFoundError } from "~/lib/errors";

export type Group = Awaited<ReturnType<typeof getGroup>>;

export async function getGroup(db: Database, groupName: string) {
  const members = await db.query.accounts.findMany({
    where: eq(lower(accounts.groupName), groupName.toLowerCase()),
    orderBy: [asc(lower(accounts.username))],
    with: {
      items: {
        columns: {
          id: true,
          quantity: true,
        },
      },
    },
    columns: {
      username: true,
      accountType: true,
      groupName: true,
      clanName: true,
      clanRank: true,
      clanIcon: true,
      clanTitle: true,
      defaultClogPage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (members.length === 0) {
    throw RuneProfileAccountNotFoundError;
  }

  const formattedMembers = members.map((member) => {
    const accountType =
      AccountTypes.find((type) => type.id === member.accountType) ||
      AccountTypes[0];

    const isClanFilled =
      !!member.clanName &&
      member.clanRank !== null &&
      member.clanIcon !== null &&
      !!member.clanTitle;

    const clan = isClanFilled
      ? {
          name: member.clanName!,
          rank: member.clanRank!,
          icon: member.clanIcon!,
          title: member.clanTitle!,
        }
      : null;

    const items = member.items.map((item) => {
      const itemName = COLLECTION_LOG_ITEMS[item.id];
      return {
        id: item.id,
        name: itemName || "Unknown",
        quantity: item.quantity,
      };
    });

    return {
      username: member.username,
      accountType,
      clan,
      defaultClogPage: member.defaultClogPage,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      items,
    };
  });

  return {
    groupName: members[0]?.groupName || groupName,
    members: formattedMembers,
  };
}
