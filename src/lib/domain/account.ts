import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { account, item } from "~/db/schema";

export function getAccounts() {
  return db.query.account.findMany({
    columns: {
      username: true,
      generatedPath: true,
      isPrivate: true,
    },
  });
}

export function getAccountInfo(username: string) {
  return db.query.account
    .findFirst({
      where: (account, { eq }) => eq(account.username, username),
      columns: {
        username: true,
        generatedPath: true,
        isPrivate: true,
      },
    })
    .execute();
}

export async function getAccountDisplayData(
  username: string,
  includeAccountHash = false
) {
  const accountHashResult = await db
    .select({
      accountHash: account.accountHash,
    })
    .from(account)
    .where(eq(account.username, username));

  const accountHash = accountHashResult[0]?.accountHash;

  if (!accountHash) {
    throw new Error("Account not found");
  }

  const relationalDataQuery = db.query.account
    .findFirst({
      where: (account, { eq }) => eq(account.accountHash, accountHash),
      columns: {
        ...(includeAccountHash && { accountHash: true }),
        username: true,
        generatedPath: true,
        isPrivate: true,
        accountType: true,
        combatLevel: true,
        description: true,
        modelUri: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        skills: {
          columns: {
            name: true,
            xp: true,
          },
          orderBy: (skills, { asc }) => asc(skills.index),
        },
        questList: {
          columns: {
            points: true,
          },
          with: {
            quests: {
              columns: {
                index: true,
                name: true,
                state: true,
                type: true,
              },
            },
          },
        },
        collectionLog: {
          columns: {
            uniqueItemsObtained: true,
            uniqueItemsTotal: true,
          },
          with: {
            tabs: {
              orderBy: (tab, { asc }) => [asc(tab.index)],
              columns: {
                index: true,
                name: true,
              },
              with: {
                entries: {
                  orderBy: (entry, { asc }) => [asc(entry.index)],
                  columns: {
                    index: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    .execute();

  const itemsQuery = db
    .select({
      entryName: item.entryName,
      totalItems: sql<number>`COUNT(DISTINCT ${item.id})`,
      totalItemsObtained: sql<number>`COUNT(DISTINCT CASE WHEN ${item.quantity} > 0 THEN ${item.id} END)`,
    })
    .from(item)
    .groupBy(item.entryName)
    .where(eq(item.accountHash, accountHash))
    .execute();

  const [relationalData, items] = await Promise.all([
    relationalDataQuery,
    itemsQuery,
  ]);

  if (!relationalData) {
    throw new Error("Account Data not found");
  }

  // Attaching the property "isCompleted" to the entries of the collection log.
  // An entry has been completed if all items has been obtained.
  // Drizzle ORM doesn't support aggregates in relational queries yet.
  // So we have to do this manually.
  const data = {
    ...relationalData,
    collectionLog: {
      ...relationalData.collectionLog,
      tabs: relationalData.collectionLog.tabs.map((tab) => ({
        ...tab,
        entries: tab.entries.map((entry) => ({
          ...entry,
          isCompleted:
            items.find(
              (item) =>
                item.entryName === entry.name &&
                item.totalItems === item.totalItemsObtained
            ) !== undefined,
        })),
      })),
    },
  };

  return data;
}
