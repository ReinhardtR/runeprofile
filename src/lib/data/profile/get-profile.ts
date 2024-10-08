import { eq, sql } from "drizzle-orm";

import { QuestState, QuestType } from "~/lib/constants/quests";
import {
  AccountIsPrivateError,
  AccountNotFoundByGeneratedUrlPath,
  AccountNotFoundByHashError,
  AccountNotFoundByUsernameError,
} from "~/lib/data/errors";
import {
  AccountType,
  AchievementDiaries,
  AchievementDiaryTierName,
  AchievementDiaryTierNames,
  CollectionLogItem,
  CollectionLogKillCount,
  CollectionLogTab,
  CombatAchievementsTierName,
  CombatAchievementsTierNames,
  Hiscores,
  HiscoresEntry,
  HiscoresGameMode,
  ProfileFull,
  ProfileFullWithHash,
} from "~/lib/domain/profile-data-types";
import { db } from "~/db";
import { accounts } from "~/db/schema";

type FindAccountParams =
  | {
      accountHash: string;
      username?: never;
      generatedUrlPath?: never;
    }
  | {
      username: string;
      accountHash?: never;
      generatedUrlPath?: never;
    }
  | {
      generatedUrlPath: string;
      accountHash?: never;
      username?: never;
    };

type FindAccountOptions = {
  includePrivate?: boolean;
};

export async function getProfileFull(
  params: FindAccountParams,
  options = { includePrivate: false } as FindAccountOptions
): Promise<ProfileFull> {
  const { accountHash: _accountHash, ...profile } =
    await getProfileFullWithHash(params, options);
  return profile;
}

export async function getProfileFullWithHash(
  { accountHash, username, generatedUrlPath }: FindAccountParams,
  options = { includePrivate: false } as FindAccountOptions
): Promise<ProfileFullWithHash> {
  const condition = accountHash
    ? eq(accounts.accountHash, accountHash!)
    : username
      ? eq(sql`LOWER(${accounts.username})`, username!.toLowerCase())
      : eq(accounts.generatedUrlPath, generatedUrlPath!.toLowerCase());

  const accountCheck = await db.query.accounts.findFirst({
    where: condition,
    columns: {
      accountHash: true,
      isPrivate: true,
    },
  });

  if (!accountCheck) {
    if (accountHash) {
      throw new AccountNotFoundByHashError(accountHash);
    } else if (username) {
      throw new AccountNotFoundByUsernameError(username);
    } else if (generatedUrlPath) {
      throw new AccountNotFoundByGeneratedUrlPath(generatedUrlPath);
    } else {
      throw new Error("Invalid params");
    }
  }

  if (username && accountCheck.isPrivate && !options.includePrivate) {
    throw new AccountIsPrivateError(username);
  }

  const data = await db.query.accounts.findFirst({
    where: eq(accounts.accountHash, accountCheck.accountHash),
    with: {
      skills: {
        with: {
          skill: true,
        },
      },
      quests: {
        with: {
          quest: true,
        },
      },
      hiscoresEntries: {
        with: {
          hiscore: true,
        },
      },
      combatAchievementTiers: {
        with: {
          combatAchievementTier: true,
        },
      },
      achievementDiaries: {
        with: {
          achievementDiary: true,
        },
      },
      clogItemObtainedKcs: {
        columns: {
          itemId: true,
          count: true,
        },
        with: {
          kc: {
            columns: {
              label: true,
            },
            with: {
              kcPages: {
                where: (page) => eq(page.metaApproved, true),
                columns: {
                  orderIdx: true,
                },
              },
            },
          },
        },
      },
      clogItems: {
        columns: {
          quantity: true,
          obtainedAt: true,
        },
        with: {
          item: {
            columns: {
              id: true,
              name: true,
              metaApproved: true,
            },
            with: {
              itemPages: {
                columns: {
                  orderIdx: true,
                },
                where: (page) => eq(page.metaApproved, true),
                with: {
                  page: {
                    columns: {
                      id: true,
                      tab: true,
                      name: true,
                      orderIdx: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      clogKcs: {
        columns: {
          count: true,
        },
        with: {
          kc: {
            columns: {
              label: true,
              metaApproved: true,
            },
            with: {
              kcPages: {
                columns: {
                  pageId: true,
                  orderIdx: true,
                },
                where: (data) => eq(data.metaApproved, true),
              },
            },
          },
        },
      },
    },
  });

  if (!data) {
    throw new Error("Account data not found");
  }

  // map data into AccountFullWithHash
  const accountFullWithHash = {
    accountHash: data.accountHash,
    username: data.username,
    accountType: data.accountType.toUpperCase() as AccountType,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    description: data.description,
    modelUri: data.modelUri,
    skills: data.skills
      .map((s) => ({
        name: s.skill.name,
        xp: s.xp,
        orderIdx: s.skill.orderIdx,
      }))
      .sort((a, b) => {
        if (a.orderIdx > b.orderIdx) return 1;
        if (a.orderIdx < b.orderIdx) return -1;
        return 0;
      }),
    questList: {
      points: data.questPoints,
      quests: data.quests
        .map((q) => ({
          name: q.quest.name,
          state: q.state.toUpperCase() as QuestState,
          type: q.quest.type.toUpperCase() as QuestType,
          orderIdx: q.quest.orderIdx,
        }))
        .sort((a, b) => {
          if (a.orderIdx > b.orderIdx) return 1;
          if (a.orderIdx < b.orderIdx) return -1;
          return 0;
        }),
    },
    achievementDiaries: data.achievementDiaries
      .reduce<AchievementDiaries>((areas, ad) => {
        const area = areas.find((a) => a.area === ad.achievementDiary.area);
        const tier = {
          name: ad.achievementDiary.tier.toUpperCase() as AchievementDiaryTierName,
          tasksTotal: ad.achievementDiary.tasksTotal,
          tasksCompleted: ad.tasksCompleted,
        };
        if (area) {
          area.tiers.push(tier);
        } else {
          areas.push({
            area: ad.achievementDiary.area,
            tiers: [tier],
          });
        }

        return areas;
      }, [])
      .sort((a, b) => {
        if (a.area > b.area) return 1;
        if (a.area < b.area) return -1;
        return 0;
      })
      .map((ad) => {
        ad.tiers.sort(
          (a, b) =>
            AchievementDiaryTierNames.indexOf(a.name) -
            AchievementDiaryTierNames.indexOf(b.name)
        );
        return ad;
      }),
    combatAchievements: data.combatAchievementTiers
      .map((tier) => ({
        tier: tier.combatAchievementTier.tier.toUpperCase() as CombatAchievementsTierName,
        tasksCompleted: tier.tasksCompleted,
        tasksTotal: tier.combatAchievementTier.tasksTotal,
      }))
      .sort(
        (a, b) =>
          CombatAchievementsTierNames.indexOf(a.tier) -
          CombatAchievementsTierNames.indexOf(b.tier)
      ),
    hiscores: data.hiscoresEntries
      .reduce<Hiscores>((hiscores, e) => {
        const leaderboard = hiscores.find(
          (h) => h.gameMode === e.hiscore.gameMode
        );
        const entry: HiscoresEntry = {
          activity: e.hiscore.activity,
          rank: e.rank,
          score: e.score,
          orderIdx: e.hiscore.orderIdx,
        };
        if (leaderboard) {
          leaderboard.entries.push(entry);
        } else {
          hiscores.push({
            gameMode: e.hiscore.gameMode as HiscoresGameMode,
            entries: [entry],
          });
        }
        return hiscores;
      }, [])
      .map((gameMode) => {
        gameMode.entries.sort((a, b) => a.orderIdx - b.orderIdx);
        return gameMode;
      }),
    collectionLog: (() => {
      let uniqueItemsTotal = 0;
      let uniqueItemsObtained = 0;
      const tabs: CollectionLogTab[] = [];
      const items: CollectionLogItem[] = [];

      data.clogItems.forEach((itemData) => {
        if (!itemData.item.metaApproved) return;

        uniqueItemsTotal += 1;
        if (itemData.obtainedAt) {
          uniqueItemsObtained += 1;
        }

        // Add tabs and pages
        itemData.item.itemPages.forEach((pageData) => {
          // Use existing tab or create new one
          let tab = tabs.find((t) => t.name === pageData.page.tab);
          if (!tab) {
            const newTab = {
              name: pageData.page.tab,
              orderIdx: pageData.page.orderIdx,
              pages: [],
            };
            tabs.push(newTab);
            tab = newTab;
          }

          // Use existing page or create new one
          const page = tab.pages.find((p) => p.name === pageData.page.name);
          if (!page) {
            const killCounts = data.clogKcs.reduce<CollectionLogKillCount[]>(
              (kcs, kcData) => {
                const kcPage = kcData.kc.kcPages.find(
                  (kcPageData) => kcPageData.pageId === pageData.page.id
                );

                if (kcPage) {
                  kcs.push({
                    label: kcData.kc.label,
                    count: kcData.count,
                    orderIdx: kcPage.orderIdx,
                  });
                }

                return kcs;
              },
              []
            );

            // Add page
            tab.pages.push({
              name: pageData.page.name,
              orderIdx: pageData.page.orderIdx,
              killCounts,
              itemIds: [],
            });
          }
        });

        // Add item
        items.push({
          id: itemData.item.id,
          name: itemData.item.name,
          quantity: itemData.quantity,
          obtainedAt: itemData.obtainedAt
            ? {
                timestamp: itemData.obtainedAt,
                killCounts: data.clogItemObtainedKcs
                  .filter((k) => k.itemId === itemData.item.id)
                  .map((k) => ({
                    label: k.kc.label,
                    count: k.count,
                    orderIdx: k.kc.kcPages[0]?.orderIdx ?? 0,
                  })),
              }
            : undefined,
        });

        // Add item to pages
        itemData.item.itemPages.forEach((pageData) => {
          tabs
            .find((t) => t.name === pageData.page.tab)
            ?.pages.find((p) => p.name === pageData.page.name)
            ?.itemIds.push(itemData.item.id);
        });
      });

      tabs.forEach((tab) => {
        // sort clog pages
        tab.pages.sort((a, b) => a.orderIdx - b.orderIdx);

        // sort items on each page
        tab.pages.forEach((page) => {
          page.itemIds.sort((a, b) => {
            const orderIdxA = data.clogItems
              .find((i) => i.item.id === a)
              ?.item.itemPages.find((p) => p.page.name === page.name)?.orderIdx;
            if (!orderIdxA) return -1;
            const orderIdxB = data.clogItems
              .find((i) => i.item.id === b)
              ?.item.itemPages.find((p) => p.page.name === page.name)?.orderIdx;
            if (!orderIdxB) return 1;
            return orderIdxA > orderIdxB ? 1 : -1;
          });
        });
      });

      return {
        uniqueItemsTotal,
        uniqueItemsObtained,
        tabs,
        items,
      };
    })(),
  };

  return accountFullWithHash;
}
