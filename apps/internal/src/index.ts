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
          itemSources: {
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

      const itemSources: Prisma.ItemSourceCreateWithoutKillCountsInput[] = [];
      const items: Prisma.ItemCreateManyInput[] = [];

      Object.values(collectionLog.tabs).forEach((tab) => {
        Object.entries(tab).forEach(([sourceName, source]) => {
          itemSources.push({
            name: sourceName,
            items: {
              connect: source.items.map((item) => ({
                id: item.id,
              })),
            },
          });

          source.items.forEach((item) => {
            items.push({
              id: item.id,
              name: item.name,
            });
          });
        });
      });

      const queries: PrismaPromise<any>[] = [];

      await ctx.loading.start({
        title: "Updating Item Schema",
        description: "Deleting old Item Sources",
      });
      await prisma.itemSource.deleteMany();

      await ctx.loading.update({
        description: "Deleting old Items",
      });
      await prisma.item.deleteMany();

      await ctx.loading.update({
        description: "Creating new Items",
      });
      await prisma.item.createMany({
        data: items,
        skipDuplicates: true,
      });

      itemSources.forEach((itemSource) => {
        queries.push(
          prisma.itemSource.create({
            data: itemSource,
          })
        );
      });

      await ctx.loading.update({
        description:
          "Creating new Item Sources and connecting them to the new Items",
        itemsInQueue: queries.length,
      });

      for (const query of queries) {
        await query;
        await ctx.loading.completeOne();
      }

      const newItemSchema = await prisma.item.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          itemSources: {
            select: {
              name: true,
            },
          },
        },
      });

      await io.display.table("Current Item Schema", {
        helpText: `There is currently ${newItemSchema.length} items in the database.`,
        data: newItemSchema,
      });
    },
  },
});

// This is important! If you don't call listen(), your app won't connect to Interval.
interval.listen();
