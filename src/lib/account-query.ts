import { prisma } from "@/server/prisma";
import { AsyncReturnType } from "@/types/AsyncReturnType";

// Username may also be a generated string for private accounts.
export const minimalAccountQueryByUsername = (username: string) => {
  return prisma.account.findUnique({
    where: { username },
    select: {
      accountHash: true,
      username: true,
      isPrivate: true,
    },
  });
};

export const minimalAccountQueryByGeneratedPath = (generatedPath: string) => {
  return prisma.account.findUnique({
    where: { generatedPath },
    select: {
      accountHash: true,
      username: true,
      isPrivate: true,
    },
  });
};

export const accountQuery = async ({
  accountHash,
}: {
  accountHash: bigint;
}) => {
  const account = await prisma.account.findUnique({
    where: { accountHash },
    select: {
      username: true,
      accountType: true,
      description: true,
      combatLevel: true,
      modelUri: true,
      skills: {
        select: {
          name: true,
          xp: true,
        },
        orderBy: {
          index: "asc",
        },
      },
      achievementDiaries: {
        select: {
          area: true,
          tiers: {
            select: {
              tier: true,
              completed: true,
              total: true,
            },
            orderBy: {
              tier: "asc",
            },
          },
        },
      },
      combatAchievements: {
        select: {
          tiers: {
            select: {
              tier: true,
              completed: true,
              total: true,
            },
            orderBy: {
              tier: "asc",
            },
          },
        },
      },
      questList: {
        select: {
          points: true,
          quests: {
            select: {
              name: true,
              state: true,
              type: true,
            },
            orderBy: {
              index: "asc",
            },
          },
        },
      },
      hiscores: {
        select: {
          type: true,
          skills: {
            select: {
              name: true,
              rank: true,
              level: true,
              xp: true,
            },
            orderBy: {
              index: "asc",
            },
          },
          activities: {
            select: {
              name: true,
              rank: true,
              score: true,
            },
            orderBy: {
              index: "asc",
            },
          },
          bosses: {
            select: {
              name: true,
              rank: true,
              kills: true,
            },
            orderBy: {
              index: "asc",
            },
          },
        },
      },
      collectionLog: {
        select: {
          uniqueItemsObtained: true,
          uniqueItemsTotal: true,
          tabs: {
            select: {
              name: true,
              entries: {
                select: {
                  name: true,
                  killCounts: {
                    select: {
                      name: true,
                      count: true,
                    },
                    orderBy: {
                      index: "asc",
                    },
                  },
                  items: {
                    select: {
                      id: true,
                      name: true,
                      quantity: true,
                      obtainedAt: {
                        select: {
                          date: true,
                          killCounts: {
                            select: {
                              name: true,
                              count: true,
                            },
                            orderBy: {
                              index: "asc",
                            },
                          },
                        },
                      },
                    },
                    orderBy: {
                      index: "asc",
                    },
                  },
                },
                orderBy: {
                  index: "asc",
                },
              },
            },
            orderBy: {
              index: "asc",
            },
          },
        },
      },
    },
  });

  return account;
};

export type AccountQueryResult = NonNullable<
  AsyncReturnType<typeof accountQuery>
>;
