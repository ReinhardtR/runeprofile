import { NextApiRequest, NextApiResponse } from "next";
import e from "@/edgeql";
import { PlayerDataSchema } from "@/lib/data-schema";
import { edgedb } from "@/server/db/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = PlayerDataSchema.parse(req.body);

  const queryStart = new Date();
  console.log("Query Start: ", queryStart.toUTCString());

  // Account
  const accountQuery = e
    .insert(e.Account, {
      account_hash: data.accountHash,
      username: data.username,
      account_type: data.accountType,
      achievement_diaries: data.achievementDiaries,
      combat_achievements: data.combatAchievements,
      skills: data.skills,
      model: data.model,
      quest_list: data.questList,
      hiscores: data.hiscores,
      updated_at: e.datetime_current(),
    })
    .unlessConflict((account) => ({
      on: account.account_hash,
      else: e.update(account, () => ({
        set: {
          username: data.username,
          account_type: data.accountType,
          achievement_diaries: data.achievementDiaries,
          combat_achievements: data.combatAchievements,
          skills: data.skills,
          model: data.model,
          quest_list: data.questList,
          hiscores: data.hiscores,
          updated_at: e.datetime_current(),
        },
      })),
    }));

  console.log("ACCOUNT QUERY");
  const accountResult = await accountQuery.run(edgedb);

  // Collection Log
  const collectionLogQuery = e
    .insert(e.CollectionLog, {
      unique_items_obtained: data.collectionLog.uniqueItemsObtained,
      unique_items_total: data.collectionLog.uniqueItemsTotal,
      account: e.select(e.Account, (account) => ({
        filter: e.op(account.id, "=", e.uuid(accountResult.id)),
      })),
    })
    .unlessConflict((collectionLog) => ({
      on: collectionLog.account,
      else: e.update(collectionLog, () => ({
        set: {
          unique_items_obtained: data.collectionLog.uniqueItemsObtained,
          unique_items_total: data.collectionLog.uniqueItemsTotal,
        },
      })),
    }));

  console.log("COLLECTION LOG QUERY");
  const collectionLogResult = await collectionLogQuery.run(edgedb);

  const collectionLogSelect = e.select(e.CollectionLog, (log) => ({
    filter: e.op(log.id, "=", e.uuid(collectionLogResult.id)),
  }));

  // Tabs
  const tabsQuery = e.params(
    {
      tabs: e.array(e.str),
    },
    ($) => {
      return e.for(e.array_unpack($.tabs), (tabName) => {
        return e.select(
          e
            .insert(e.Tab, {
              collection_log: collectionLogSelect,
              name: tabName,
            })
            .unlessConflict((tab) => ({
              on: e.tuple([tab.collection_log, tab.name]),
              else: tab,
            })),
          () => ({
            id: true,
            name: true,
          })
        );
      });
    }
  );

  console.log("TABS QUERY");
  const tabsResult = await tabsQuery.run(edgedb, {
    tabs: Object.keys(data.collectionLog.tabs),
  });

  const tabsMap = new Map<string, string>();
  tabsResult.forEach((tab) => {
    tabsMap.set(tab.name, tab.id);
  });

  // Entries
  const entriesQuery = e.params({ entries: e.json }, ($) => {
    return e.for(e.json_array_unpack($.entries), (entryData) => {
      return e.select(
        e
          .insert(e.Entry, {
            tab: e.select(e.Tab, (tab) => ({
              filter: e.op(tab.id, "=", e.cast(e.uuid, entryData.tabId)),
            })),
            index: e.cast(e.int16, entryData.index),
            name: e.cast(e.str, entryData.name),
            kill_counts: e.cast(
              e.array(e.tuple({ name: e.str, count: e.int32 })),
              e.op(entryData.killCounts, "??", e.to_json("[]"))
            ),
            updated_at: e.datetime_current(),
          })
          .unlessConflict((entry) => ({
            on: e.tuple([entry.tab, entry.name]),
            else: e.update(entry, () => ({
              set: {
                index: e.cast(e.int16, entryData.index),
                kill_counts: e.cast(
                  e.array(e.tuple({ name: e.str, count: e.int32 })),
                  e.op(entryData.killCounts, "??", e.to_json("[]"))
                ),
                updated_at: e.datetime_current(),
              },
            })),
          })),
        () => ({
          id: true,
          name: true,
        })
      );
    });
  });

  const entriesParams = Object.entries(data.collectionLog.tabs).flatMap(
    ([tabName, tabData]) => {
      return Object.entries(tabData).map(([entryName, entryData]) => ({
        tabId: tabsMap.get(tabName)!, // is based on same data, must exist.
        index: entryData.index,
        name: entryName,
        killCounts: entryData.killCounts ?? [],
      }));
    }
  );

  console.log("ENTRIES QUERY");
  const entriesResult = await entriesQuery.run(edgedb, {
    entries: entriesParams,
  });

  const entriesData = Object.values(data.collectionLog.tabs).flatMap((tab) => {
    return Object.keys(tab).map((entry) => {
      return entry;
    });
  });

  console.log("Entries: ", entriesData.length);
  console.log("Result: ", entriesResult.length);

  const entriesMap = new Map<string, string>();
  entriesResult.forEach((entry) => {
    entriesMap.set(entry.name, entry.id);
  });

  // Items
  const itemsQuery = e.params(
    {
      items: e.json,
    },
    ($) => {
      return e.for(e.json_array_unpack($.items), (item) => {
        return e
          .insert(e.Item, {
            entry: e.select(e.Entry, (entry) => ({
              filter: e.op(entry.id, "=", e.cast(e.uuid, item.entryId)),
            })),
            index: e.cast(e.int16, item.index),
            item_id: e.cast(e.int32, item.item_id),
            name: e.cast(e.str, item.name),
            quantity: e.cast(e.int32, item.quantity),
            obtained_at_kill_counts: e.op(
              e.tuple({
                date: e.datetime_of_transaction(),
                kill_counts: e.cast(
                  e.array(e.tuple({ name: e.str, count: e.int32 })),
                  item.killCounts
                ),
              }),
              "if",
              e.op(e.cast(e.int32, item.quantity), ">", 0),
              "else",
              e.cast(
                e.tuple({
                  date: e.datetime,
                  kill_counts: e.array(
                    e.tuple({ name: e.str, count: e.int32 })
                  ),
                }),
                e.set()
              )
            ),
          })
          .unlessConflict((_item) => ({
            on: e.tuple([_item.entry, _item.item_id]),
            else: e.update(_item, (existingItem) => ({
              set: {
                index: e.cast(e.int16, item.index),
                name: e.cast(e.str, item.name),
                quantity: e.cast(e.int32, item.quantity),
                obtained_at_kill_counts: e.op(
                  e.tuple({
                    date: e.datetime_of_transaction(),
                    kill_counts: e.cast(
                      e.array(e.tuple({ name: e.str, count: e.int32 })),
                      item.killCounts
                    ),
                  }),
                  "if",
                  e.op(
                    e.op(e.cast(e.int32, item.quantity), ">", 0),
                    "and",
                    e.op(existingItem.quantity, "<=", 0)
                  ),
                  "else",
                  existingItem.obtained_at_kill_counts
                ),
              },
            })),
          }));
      });
    }
  );

  const itemsParams = Object.values(data.collectionLog.tabs).flatMap((tab) => {
    return Object.entries(tab).flatMap(([entryName, entryData]) => {
      return entryData.items.map((item) => ({
        entryId: entriesMap.get(entryName)!, // is based on same data, must exist.
        index: item.index,
        item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        killCounts: entryData.killCounts ?? [],
      }));
    });
  });

  console.log("ITEMS QUERY");
  await itemsQuery.run(edgedb, {
    items: itemsParams,
  });

  const queryEnd = new Date();
  console.log("Query End: ", queryEnd.toUTCString());

  const queryTime = queryEnd.getTime() - queryStart.getTime();
  console.log("Query Time: ", queryTime / 1000, "s");

  return res.status(200).json({ sucuess: "ok" });
}
