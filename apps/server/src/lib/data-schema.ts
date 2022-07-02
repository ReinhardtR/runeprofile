import { AccountType } from "db";
import { z } from "zod";
import { collectionLogSchema } from "zod-schemas";

export const playerDataSchema = z.object({
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
