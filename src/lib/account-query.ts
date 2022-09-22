import e, { $infer } from "@/edgeql";

// Username may also be a generated string for private accounts.
export const minimalAccountQueryByUsername = e.params(
  { username: e.str },
  ($) => {
    return e.select(e.Account, (_account) => ({
      filter: e.op(_account.username, "=", $.username),
      id: true,
      username: true,
      is_private: true,
    }));
  }
);

export const minimalAccountQueryByGeneratedPath = e.params(
  { generated_path: e.str },
  ($) => {
    return e.select(e.Account, (_account) => ({
      filter: e.op(_account.generated_path, "=", $.generated_path),
      id: true,
      username: true,
      is_private: true,
    }));
  }
);

export const accountQuery = e.params({ id: e.uuid }, ($) => {
  return e.assert_single(
    e.select(e.Account, (_account) => ({
      filter: e.op(_account.id, "=", $.id),
      username: true,
      account_type: true,
      is_private: true,
      model: true,
      description: true,
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
    }))
  );
});

export type AccountQueryResult = NonNullable<$infer<typeof accountQuery>>;
