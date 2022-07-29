import { z } from "zod";

export enum Skill {
  Attack = "attack",
  Hitpoints = "hitpoints",
  Mining = "mining",
  strength = "strength",
  Agility = "agility",
  Smithing = "smithing",
  Defence = "defence",
  Herblore = "herblore",
  Fishing = "fishing",
  Ranged = "ranged",
  Thieving = "thieving",
  Cooking = "cooking",
  Prayer = "prayer",
  Crafting = "crafting",
  Firemkaing = "firemaking",
  Magic = "magic",
  Fletching = "fletching",
  Woodcutting = "woodcutting",
  Runecraft = "runecraft",
  Slayer = "slayer",
  Farming = "farming",
  Construction = "construction",
  Hunter = "hunter",
}

// export type CollectionLogTemplate = {
//   [key: string]: string[];
// };

// const getCollectionLogTemplate = async () => {
//   const response = await fetch(
//     "https://api.github.com/gists/24179c0fbfb370ce162f69dde36d72f0"
//   );

//   const template = (await response.json())["files"][
//     "collection_log_template.json"
//   ]["content"];

//   return JSON.parse(template) as CollectionLogTemplate;
// };

// const entrySchema = z.object({
//   items: z.array(
//     z.object({
//       id: z.number(),
//       name: z.string(),
//       quantity: z.number(),
//       obtained: z.boolean(),
//     })
//   ),
//   kill_count: z.array(z.string()).optional(),
// });

// export const getPlayerDataSchema = async () => {
//   const playerDataSchema = basicPlayerDataSchema;

//   const collectionLogTemplate = await getCollectionLogTemplate();

//   Object.entries(collectionLogTemplate).forEach(([tab, entries]) => {
//     const tabSchema = z.object({});

//     entries.forEach((entry) => {
//       tabSchema.extend({
//         [entry]: entrySchema,
//       });
//     });

//     playerDataSchema.shape.collectionLog.shape.tabs.extend({
//       [tab]: tabSchema,
//     });
//   });

//   return playerDataSchema;
// };

export const CollectionLogItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
});

export const CollectionLogEntrySchema = z.object({
  items: z.array(CollectionLogItemSchema),
  killCounts: z
    .array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    )
    .optional(),
});

export const CollectionLogTabSchema = z.record(CollectionLogEntrySchema);

export const CollectionLogSchema = z.object({
  uniquesObtained: z.number(),
  uniquesTotal: z.number(),
  tabs: z.record(CollectionLogTabSchema),
});

export const PlayerDataSchema = z.object({
  accountHash: z.number(),
  username: z.string(),
  // Switch to enum from EdgeDB schema
  accountType: z.enum([
    "NORMAL",
    "IRONMAN",
    "ULTIMATE_IRONMAN",
    "HARDCORE_IRONMAN",
    "GROUP_IRONMAN",
    "HARDCORE_GROUP_IRONMAN",
    "UNRANKED_GROUP_IRONMAN",
  ]),
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
  collectionLog: CollectionLogSchema,
});
