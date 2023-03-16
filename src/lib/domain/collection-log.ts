import { db } from "~/db/client";

export async function getCollectionLogEntry({
  username,
  tabName,
  entryName,
}: {
  username: string;
  tabName: string;
  entryName: string;
}) {
  const account = await db
    .selectFrom("Account")
    .select(["accountHash"])
    .where("username", "=", username)
    .executeTakeFirst();

  if (!account) {
    return;
  }

  const [killCountsResult, itemsResult, obtainedAtsResult] = await Promise.all([
    // Kill counts
    db
      .selectFrom("KillCount")
      .select(["name", "count"])
      .where("accountHash", "=", account.accountHash)
      .where("tabName", "=", tabName)
      .where("entryName", "=", entryName)
      .orderBy("index", "asc")
      .execute(),
    // Items
    db
      .selectFrom("Item")
      .select(["id", "name", "quantity"])
      .where("accountHash", "=", account.accountHash)
      .where("tabName", "=", tabName)
      .where("entryName", "=", entryName)
      .orderBy("index", "asc")
      .execute(),
    // Obtained at kill counts
    db
      .selectFrom("ObtainedAtKillCount")
      .where("ObtainedAtKillCount.accountHash", "=", account.accountHash)
      .where("ObtainedAtKillCount.tabName", "=", tabName)
      .where("ObtainedAtKillCount.entryName", "=", entryName)
      .leftJoin("ObtainedAt", (join) =>
        join
          .onRef(
            "ObtainedAt.accountHash",
            "=",
            "ObtainedAtKillCount.accountHash"
          )
          .onRef("ObtainedAt.tabName", "=", "ObtainedAtKillCount.tabName")
          .onRef("ObtainedAt.entryName", "=", "ObtainedAtKillCount.entryName")
          .onRef("ObtainedAt.itemId", "=", "ObtainedAtKillCount.itemId")
      )
      .select([
        "ObtainedAtKillCount.itemId",
        "ObtainedAtKillCount.name",
        "ObtainedAtKillCount.count",
        "ObtainedAt.date",
      ])
      .orderBy("ObtainedAtKillCount.index", "asc")
      .execute(),
  ]);

  const items = itemsResult.map((item) => {
    const obtainedAtResult = obtainedAtsResult.filter(
      (obtainedAt) => obtainedAt.itemId === item.id
    );

    const obtainedAt =
      obtainedAtResult.length > 0
        ? {
            date: obtainedAtResult[0]?.date!,
            killCounts: obtainedAtResult.map((obtainedAt) => ({
              name: obtainedAt.name,
              count: obtainedAt.count,
            })),
          }
        : undefined;

    return {
      ...item,
      ...(obtainedAt && { obtainedAt }), // conditonally add obtainedAt
    };
  });

  return {
    name: entryName,
    tabName: tabName,
    killCounts: killCountsResult,
    items,
  };
}
