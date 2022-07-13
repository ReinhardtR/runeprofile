import { AccountType, Prisma } from "db";
import { prisma } from "db/client";
import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";
import { collectionLogSchema } from "zod-schemas";

const getKillCountParts = (killCount: string) => {
  const parts = killCount.split(": ");

  const name = parts[0];
  const amount = Number(parts[1]);

  return [name, amount] as [string, number];
};

const playerDataSchema = z.object({
  accountHash: z.number(),
  username: z.string(),
  accountType: z.nativeEnum(AccountType),
  model: z.object({
    obj: z.string(),
    mtl: z.string(),
  }),
  skills: z.object({
    attack: z.number(),
    hitpoints: z.number(),
    mining: z.number(),
    strength: z.number(),
    agility: z.number(),
    smithing: z.number(),
    defence: z.number(),
    herblore: z.number(),
    fishing: z.number(),
    ranged: z.number(),
    thieving: z.number(),
    cooking: z.number(),
    prayer: z.number(),
    crafting: z.number(),
    firemaking: z.number(),
    magic: z.number(),
    fletching: z.number(),
    woodcutting: z.number(),
    runecraft: z.number(),
    slayer: z.number(),
    farming: z.number(),
    construction: z.number(),
    hunter: z.number(),
    overall: z.number(),
  }),
  collectionLog: collectionLogSchema.optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("SUBMITTED TO SERVER");
  console.log(req.body);

  const input = playerDataSchema.parse(req.body);
  const { accountHash, username, accountType, skills, model, collectionLog } =
    input;

  const modelBuffer = {
    obj: Buffer.from(model.obj, "utf-8"),
    mtl: Buffer.from(model.mtl, "utf-8"),
  };

  let account = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    include: {
      CollectionLog: {
        include: {
          CollectedItems: true,
          KillCounts: true,
        },
      },
    },
  });

  // If there is no account create one.
  if (!account) {
    // Create a collection log if data is provided.
    const collectionLogArgs:
      | Prisma.CollectionLogCreateNestedOneWithoutAccountInput
      | undefined = collectionLog
      ? {
          create: {
            totalItems: collectionLog.total_items,
            totalObtained: collectionLog.total_obtained,
            uniqueItems: collectionLog.unique_items,
            uniqueObtained: collectionLog.unique_obtained,
          },
        }
      : undefined;

    account = await prisma.account.create({
      data: {
        accountHash,
        username,
        accountType,
        ...skills,
        modelObj: modelBuffer.obj,
        modelMtl: modelBuffer.mtl,
        CollectionLog: collectionLogArgs,
      },
      include: {
        CollectionLog: {
          include: {
            CollectedItems: true,
            KillCounts: true,
          },
        },
      },
    });
  }

  let collectionLogUpdateArgs:
    | Prisma.CollectionLogUpdateOneWithoutAccountNestedInput["update"]
    | undefined = undefined;

  // Create collection log update args if data is provided.
  if (collectionLog) {
    const collectedsItemsToCreate: Prisma.CollectedItemCreateManyCollectionLogInput[] =
      [];
    const collectedItemsToUpdate: Prisma.CollectedItemUpdateManyWithWhereWithoutCollectionLogInput[] =
      [];
    const killCountsToCreate: Prisma.KillCountCreateManyCollectionLogInput[] =
      [];
    const killCountsToUpdate: Prisma.KillCountUpdateManyWithWhereWithoutCollectionLogInput[] =
      [];

    Object.values(collectionLog.tabs).forEach((tab) => {
      Object.entries(tab).forEach(([sourceName, source]) => {
        // Kill Counts
        source.kill_count?.forEach((killCount) => {
          const [killCountName, killCountAmount] = getKillCountParts(killCount);

          if (!killCountAmount) return;

          const storedKillCount = account?.CollectionLog?.KillCounts.find(
            (kc) => kc.name === killCountName
          );

          if (storedKillCount) {
            const hasChanged = killCountAmount !== storedKillCount.amount;

            if (hasChanged) {
              killCountsToUpdate.push({
                where: {
                  accountHash,
                  name: killCountName,
                },
                data: {
                  amount: killCountAmount,
                },
              });
            }
          } else {
            killCountsToCreate.push({
              name: killCountName,
              amount: killCountAmount,
              itemSourceName: sourceName,
            });
          }
        });

        // CollectedItems
        source.items.forEach((item) => {
          if (!item.quantity) return;

          const storedItem = account?.CollectionLog?.CollectedItems.find(
            (ci) => ci.itemId === item.id
          );

          if (storedItem) {
            const hasChanged = item.quantity != storedItem.quantity;

            if (hasChanged) {
              collectedItemsToUpdate.push({
                where: {
                  accountHash,
                  itemId: item.id,
                },
                data: {
                  quantity: item.quantity,
                },
              });
            }
          } else {
            collectedsItemsToCreate.push({
              itemId: item.id,
              quantity: item.quantity,
            });
          }
        });
      });
    });

    console.log("Item to create:", collectedsItemsToCreate.length);
    console.log("Item to update:", collectedItemsToUpdate.length);
    console.log("Kill Count to create:", killCountsToCreate.length);
    console.log("Kill Count to update:", killCountsToUpdate.length);

    collectionLogUpdateArgs = {
      totalItems: collectionLog.total_items,
      totalObtained: collectionLog.total_obtained,
      uniqueItems: collectionLog.unique_items,
      uniqueObtained: collectionLog.unique_obtained,
      CollectedItems: {
        createMany: {
          data: collectedsItemsToCreate,
          skipDuplicates: true,
        },
        updateMany: collectedItemsToUpdate,
      },
      KillCounts: {
        createMany: {
          data: killCountsToCreate,
          skipDuplicates: true,
        },
        updateMany: killCountsToUpdate,
      },
    };
  }

  // Update the account with the new data.
  const updatedAccount = await prisma.account.update({
    where: { accountHash },
    data: {
      username,
      accountType,
      modelObj: modelBuffer.obj,
      modelMtl: modelBuffer.mtl,
      ...skills,
      CollectionLog: {
        update: collectionLogUpdateArgs,
      },
    },
  });

  res.revalidate(`/u/${updatedAccount.username}`);
  return res.status(200).json({ message: "Success" });
}
