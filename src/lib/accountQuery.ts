import e, { $infer } from "@/edgeql";

export const accountQuery = e.params({ username: e.str }, ($) => {
  return e.select(e.Account, (_account) => ({
    filter: e.op(_account.username, "=", $.username),
    username: true,
    account_type: true,
    model: true,
    combat_level: true,
    skills: true,
    achievement_diaries: true,
    combat_achievements: true,
    quest_list: true,
    hiscores: true,
    collection_log: {
      unique_items_obtained: true,
      unique_items_total: true,
      tabs: (_tab) => ({
        name: true,
        entries: (entry) => ({
          name: true,
          kill_counts: true,
          items: (item) => ({
            item_id: true,
            name: true,
            quantity: true,
            obtained_at_kill_counts: true,
            order_by: {
              expression: item.index,
              direction: e.ASC,
            },
          }),
          order_by: {
            expression: entry.index,
            direction: e.ASC,
          },
        }),
      }),
    },
  }));
});

export type AccountQueryResult = NonNullable<$infer<typeof accountQuery>>;
