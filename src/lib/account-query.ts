import { prisma } from "@/server/clients/prisma";
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
  accountHash: string;
}) => {
  const account = await prisma.account.findUnique({
    where: { accountHash },
    select: {
      username: true,
      accountType: true,
      createdAt: true,
      updatedAt: true,
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
                  items: {
                    select: {
                      quantity: true,
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

  if (!account) {
    return null;
  }

  const tabs = account.collectionLog?.tabs.map((tab) => {
    const entries = tab.entries?.map((entry) => {
      const totalItems = entry.items.length;
      const obtainedItems = entry.items.filter(
        (item) => item.quantity > 0
      ).length;

      return {
        name: entry.name,
        isCompleted: totalItems === obtainedItems,
      };
    });

    return {
      ...tab,
      entries,
    };
  });

  const collectionLog = account.collectionLog
    ? {
        ...account.collectionLog,
        tabs: tabs ?? [],
      }
    : undefined;

  return {
    ...account,
    collectionLog,
  };
};

export type AccountQueryResult = NonNullable<
  AsyncReturnType<typeof accountQuery>
>;
