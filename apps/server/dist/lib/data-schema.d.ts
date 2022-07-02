import { z } from "zod";
export declare const playerDataSchema: z.ZodObject<{
    accountHash: z.ZodNumber;
    username: z.ZodString;
    accountType: z.ZodNativeEnum<{
        NORMAL: "NORMAL";
        IRONMAN: "IRONMAN";
        HARDCORE_IRONMAN: "HARDCORE_IRONMAN";
        ULTIMATE_IRONMAN: "ULTIMATE_IRONMAN";
        GROUP_IRONMAN: "GROUP_IRONMAN";
        HARDCORE_GROUP_IRONMAN: "HARDCORE_GROUP_IRONMAN";
    }>;
    model: z.ZodObject<{
        obj: z.ZodString;
        mtl: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        obj: string;
        mtl: string;
    }, {
        obj: string;
        mtl: string;
    }>;
    skills: z.ZodObject<{
        attack: z.ZodNumber;
        hitpoints: z.ZodNumber;
        mining: z.ZodNumber;
        strength: z.ZodNumber;
        agility: z.ZodNumber;
        smithing: z.ZodNumber;
        defence: z.ZodNumber;
        herblore: z.ZodNumber;
        fishing: z.ZodNumber;
        ranged: z.ZodNumber;
        thieving: z.ZodNumber;
        cooking: z.ZodNumber;
        prayer: z.ZodNumber;
        crafting: z.ZodNumber;
        firemaking: z.ZodNumber;
        magic: z.ZodNumber;
        fletching: z.ZodNumber;
        woodcutting: z.ZodNumber;
        runecraft: z.ZodNumber;
        slayer: z.ZodNumber;
        farming: z.ZodNumber;
        construction: z.ZodNumber;
        hunter: z.ZodNumber;
        overall: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        attack: number;
        hitpoints: number;
        mining: number;
        strength: number;
        agility: number;
        smithing: number;
        defence: number;
        herblore: number;
        fishing: number;
        ranged: number;
        thieving: number;
        cooking: number;
        prayer: number;
        crafting: number;
        firemaking: number;
        magic: number;
        fletching: number;
        woodcutting: number;
        runecraft: number;
        slayer: number;
        farming: number;
        construction: number;
        hunter: number;
        overall: number;
    }, {
        attack: number;
        hitpoints: number;
        mining: number;
        strength: number;
        agility: number;
        smithing: number;
        defence: number;
        herblore: number;
        fishing: number;
        ranged: number;
        thieving: number;
        cooking: number;
        prayer: number;
        crafting: number;
        firemaking: number;
        magic: number;
        fletching: number;
        woodcutting: number;
        runecraft: number;
        slayer: number;
        farming: number;
        construction: number;
        hunter: number;
        overall: number;
    }>;
    collectionLog: z.ZodObject<{
        total_obtained: z.ZodNumber;
        total_items: z.ZodNumber;
        unique_obtained: z.ZodNumber;
        unique_items: z.ZodNumber;
        tabs: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodNumber;
                name: z.ZodString;
                quantity: z.ZodNumber;
                obtained: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }, {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }>, "many">;
            kill_count: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }>>>;
    }, "strip", z.ZodTypeAny, {
        total_obtained: number;
        total_items: number;
        unique_obtained: number;
        unique_items: number;
        tabs: Record<string, Record<string, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }>>;
    }, {
        total_obtained: number;
        total_items: number;
        unique_obtained: number;
        unique_items: number;
        tabs: Record<string, Record<string, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }>>;
    }>;
}, "strip", z.ZodTypeAny, {
    accountHash: number;
    username: string;
    accountType: "NORMAL" | "IRONMAN" | "HARDCORE_IRONMAN" | "ULTIMATE_IRONMAN" | "GROUP_IRONMAN" | "HARDCORE_GROUP_IRONMAN";
    model: {
        obj: string;
        mtl: string;
    };
    skills: {
        attack: number;
        hitpoints: number;
        mining: number;
        strength: number;
        agility: number;
        smithing: number;
        defence: number;
        herblore: number;
        fishing: number;
        ranged: number;
        thieving: number;
        cooking: number;
        prayer: number;
        crafting: number;
        firemaking: number;
        magic: number;
        fletching: number;
        woodcutting: number;
        runecraft: number;
        slayer: number;
        farming: number;
        construction: number;
        hunter: number;
        overall: number;
    };
    collectionLog: {
        total_obtained: number;
        total_items: number;
        unique_obtained: number;
        unique_items: number;
        tabs: Record<string, Record<string, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }>>;
    };
}, {
    accountHash: number;
    username: string;
    accountType: "NORMAL" | "IRONMAN" | "HARDCORE_IRONMAN" | "ULTIMATE_IRONMAN" | "GROUP_IRONMAN" | "HARDCORE_GROUP_IRONMAN";
    model: {
        obj: string;
        mtl: string;
    };
    skills: {
        attack: number;
        hitpoints: number;
        mining: number;
        strength: number;
        agility: number;
        smithing: number;
        defence: number;
        herblore: number;
        fishing: number;
        ranged: number;
        thieving: number;
        cooking: number;
        prayer: number;
        crafting: number;
        firemaking: number;
        magic: number;
        fletching: number;
        woodcutting: number;
        runecraft: number;
        slayer: number;
        farming: number;
        construction: number;
        hunter: number;
        overall: number;
    };
    collectionLog: {
        total_obtained: number;
        total_items: number;
        unique_obtained: number;
        unique_items: number;
        tabs: Record<string, Record<string, {
            kill_count?: string[] | undefined;
            items: {
                id: number;
                name: string;
                quantity: number;
                obtained: boolean;
            }[];
        }>>;
    };
}>;
//# sourceMappingURL=data-schema.d.ts.map