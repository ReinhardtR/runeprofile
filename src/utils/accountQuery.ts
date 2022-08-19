import e, { $infer } from "@/edgeql";

export const accountQuery = e.params({ username: e.str }, ($) => {
  return e.select(e.Account, (_account) => ({
    filter: e.op(_account.username, "=", $.username),
    username: true,
    account_type: true,
    model: true,
    skills: true,
    achievement_diaries: true,
    combat_achievements: true,
    quest_list: true,
    collection_log: {
      unique_items_obtained: true,
      unique_items_total: true,
      tabs: (_tab) => ({
        name: true,
        entries: (_entry) => ({
          name: true,
          kill_counts: true,
          items: (item) => ({
            item_id: true,
            name: true,
            quantity: true,
            obtained_at_kill_counts: true,
          }),
        }),
      }),
    },
  }));
});

export type AccountQueryResult = NonNullable<$infer<typeof accountQuery>>;
