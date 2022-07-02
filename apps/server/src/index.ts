import Fastify from "fastify";
import { prisma } from "db/client";
import { playerDataSchema } from "./lib/data-schema";
import { getKillCountParts } from "./lib/utils";
import { Prisma } from "db";

const fastify = Fastify({
  logger: true,
});

const port = 3002;

fastify.post("/submit", async (req, res) => {
  console.log("SUBMITTED TO SERVER");

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
    const collecItemsToUpdate: Prisma.CollectedItemUpdateManyWithWhereWithoutCollectionLogInput[] =
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

          const killCountExists = account?.CollectionLog?.KillCounts.some(
            (kc) => kc.name === sourceName
          );

          if (killCountExists) {
            killCountsToUpdate.push({
              where: {
                accountHash,
                name: killCountName,
              },
              data: {
                amount: killCountAmount,
              },
            });
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

          const itemExists = account?.CollectionLog?.CollectedItems.some(
            (ci) => ci.itemId === item.id
          );

          if (itemExists) {
            collecItemsToUpdate.push({
              where: {
                accountHash,
                itemId: item.id,
              },
              data: {
                quantity: item.quantity,
              },
            });
          } else {
            collectedsItemsToCreate.push({
              itemId: item.id,
              quantity: item.quantity,
            });
          }
        });
      });
    });

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
        updateMany: collecItemsToUpdate,
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
  await prisma.account.update({
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

  return res.status(200).send({ message: "Success" });
});

fastify.listen({ port }, (err, address) => {
  if (err) throw err;
});
