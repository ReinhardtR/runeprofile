"use strict";
exports.__esModule = true;
exports.playerDataSchema = void 0;
var db_1 = require("db");
var zod_1 = require("zod");
var zod_schemas_1 = require("zod-schemas");
exports.playerDataSchema = zod_1.z.object({
    accountHash: zod_1.z.number(),
    username: zod_1.z.string(),
    accountType: zod_1.z.nativeEnum(db_1.AccountType),
    model: zod_1.z.object({
        obj: zod_1.z.string(),
        mtl: zod_1.z.string()
    }),
    skills: zod_1.z.object({
        attack: zod_1.z.number(),
        hitpoints: zod_1.z.number(),
        mining: zod_1.z.number(),
        strength: zod_1.z.number(),
        agility: zod_1.z.number(),
        smithing: zod_1.z.number(),
        defence: zod_1.z.number(),
        herblore: zod_1.z.number(),
        fishing: zod_1.z.number(),
        ranged: zod_1.z.number(),
        thieving: zod_1.z.number(),
        cooking: zod_1.z.number(),
        prayer: zod_1.z.number(),
        crafting: zod_1.z.number(),
        firemaking: zod_1.z.number(),
        magic: zod_1.z.number(),
        fletching: zod_1.z.number(),
        woodcutting: zod_1.z.number(),
        runecraft: zod_1.z.number(),
        slayer: zod_1.z.number(),
        farming: zod_1.z.number(),
        construction: zod_1.z.number(),
        hunter: zod_1.z.number(),
        overall: zod_1.z.number()
    }),
    collectionLog: zod_schemas_1.collectionLogSchema
});
