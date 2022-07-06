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
