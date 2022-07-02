import Interval from "@interval/sdk";
import { Prisma, PrismaPromise } from "db";
import { prisma } from "db/client";
import { collectionLogSchema } from "zod-schemas";

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  actions: {
    UPDATE_COLLECTION_LOG_SCHEMA: async (io, ctx) => {
      ctx.loading.start("Fetching current Item Schema");

      // see current schema & choose new schema through file
      const currentItems = await prisma.item.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          ItemSources: {
            select: {
              name: true,
            },
          },
        },
      });

      const [_, file] = await io.group([
        io.display.table("Current Item Schema", {
          helpText: `There is currently ${currentItems.length} items in the database.`,
          data: currentItems,
        }),
        io.experimental.input.file("Upload the new Item Schema", {
          helpText: "Select a JSON File",
          allowedExtensions: [".json"],
        }),
      ]);

      // run task
      const newItems = await file.json();
      const result = collectionLogSchema.safeParse(newItems);

      if (!result.success) {
        throw new Error("The provided JSON file is invalid.");
      }

      const collectionLog = result.data;

      const queries: PrismaPromise<any>[] = [];

      const itemsCreatedInPreviousLoops: number[] = [];

      Object.values(collectionLog.tabs).forEach((tab) => {
        Object.entries(tab).forEach(([sourceName, source]) => {
          const itemSourceExists = currentItems.some((item) => {
            return item.ItemSources.some(
              (itemSource) => itemSource.name === sourceName
            );
          });

          const items = {
            create: [] as Prisma.ItemCreateWithoutItemSourcesInput[],
            connect: [] as Prisma.ItemWhereUniqueInput[],
          };

          source.items.forEach((item) => {
            const itemExists =
              currentItems.some((currentItem) => {
                return currentItem.id === item.id;
              }) || itemsCreatedInPreviousLoops.some((id) => id === item.id);

            if (itemExists) {
              // Items to connect
              items.connect.push({
                id: item.id,
              });
            } else {
              // Items to create
              items.create.push({
                id: item.id,
                name: item.name,
              });
            }
          });

          if (!itemSourceExists) {
            // Create ItemSource
            queries.push(
              prisma.itemSource.create({
                data: {
                  name: sourceName,
                  Items: items,
                },
              })
            );
          } else {
            // Update ItemSource to connect with new items
            const itemsNotAlreadyConnected = items.connect.filter((item) => {
              currentItems.some((currentItem) => {
                const sameId = currentItem.id === item.id;
                const sameSource = currentItem.ItemSources.some(
                  (currentItemSource) => currentItemSource.name === sourceName
                );

                return sameId && !sameSource;
              });
            });

            items.connect = itemsNotAlreadyConnected;

            const changesMade = items.connect.length || items.create.length;
            if (changesMade) {
              queries.push(
                prisma.itemSource.update({
                  where: {
                    name: sourceName,
                  },
                  data: {
                    Items: items,
                  },
                })
              );
            }
          }

          items.create.forEach((item) =>
            itemsCreatedInPreviousLoops.push(item.id)
          );
        });
      });

      let finalHeading;

      if (queries.length) {
        finalHeading = "New Item Schema";

        await ctx.loading.update({
          description: "Executing queries",
          itemsInQueue: queries.length,
        });

        for (const query of queries) {
          await query;
          await ctx.loading.completeOne();
        }
      } else {
        finalHeading = "No Changes";
      }

      const newItemSchema = await prisma.item.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          ItemSources: {
            select: {
              name: true,
            },
          },
        },
      });

      await io.display.table(finalHeading, {
        helpText: `There is currently ${newItemSchema.length} items in the database.`,
        data: newItemSchema,
      });
    },
  },
});

// This is important! If you don't call listen(), your app won't connect to Interval.
interval.listen();
