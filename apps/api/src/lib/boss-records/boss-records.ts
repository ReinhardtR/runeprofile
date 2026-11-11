import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { Database, bossRecords } from "@runeprofile/db";
import { CollectionLogPage } from "@runeprofile/runescape";

// Chat Commands keys are lowercase boss names ("theatre of blood hard mode").
// Bounded so a client can't grow the row without limit.
const bossKeySchema = z.string().min(1).max(100);

export const bossRecordsInputSchema = {
  killCounts: z
    .record(bossKeySchema, z.number().int().min(0).max(2_147_483_647))
    .refine((r) => Object.keys(r).length <= 1000, "Too many kill counts")
    .optional(),
  personalBests: z
    .record(
      bossKeySchema,
      z
        .number()
        .positive()
        .max(86_400 * 7),
    )
    .refine((r) => Object.keys(r).length <= 1000, "Too many personal bests")
    .optional(),
};

export type BossRecordsInput = {
  killCounts?: Record<string, number>;
  personalBests?: Record<string, number>;
};

export type BossRecords = {
  killCounts: Record<string, number>;
  personalBests: Record<string, number>;
};

/**
 * Merges the reported values into the account's stored records. Keys are
 * never removed: Chat Commands only adds or overwrites them, and a client
 * that reports nothing (plugin disabled, fresh install) must not wipe them.
 *
 * Skips the write when nothing changed, so routine syncs don't churn the row.
 * The account must exist (the row references it).
 */
export async function upsertBossRecords(
  db: Database,
  accountId: string,
  input: BossRecordsInput,
): Promise<void> {
  const killCounts = input.killCounts ?? {};
  const personalBests = input.personalBests ?? {};
  if (
    Object.keys(killCounts).length === 0 &&
    Object.keys(personalBests).length === 0
  ) {
    return;
  }

  await db
    .insert(bossRecords)
    .values({ accountId, killCounts, personalBests })
    .onConflictDoUpdate({
      target: bossRecords.accountId,
      set: {
        killCounts: sql`${bossRecords.killCounts} || excluded.kill_counts`,
        personalBests: sql`${bossRecords.personalBests} || excluded.personal_bests`,
        updatedAt: sql`now()`,
      },
      setWhere: sql`not (
        ${bossRecords.killCounts} @> excluded.kill_counts
        and ${bossRecords.personalBests} @> excluded.personal_bests
      )`,
    });
}

export async function getBossRecords(
  db: Database,
  accountId: string,
): Promise<BossRecords | null> {
  const row = await db.query.bossRecords.findFirst({
    where: eq(bossRecords.accountId, accountId),
    columns: { killCounts: true, personalBests: true },
  });
  return row ?? null;
}

export type ResolvedCounter = {
  label: string;
  shortLabel?: string;
  type: "kc" | "pb";
  // Kill count, or personal best in seconds. Null when unknown.
  value: number | null;
};

/**
 * Resolves a page's kill count / personal best lines from what the plugin
 * uploaded. Lines it has no value for stay null.
 */
export function resolvePageCounters(
  page: Pick<CollectionLogPage, "counters">,
  records: BossRecords | null,
): ResolvedCounter[] {
  return (page.counters ?? []).map((counter) => {
    const stored =
      counter.type === "kc" ? records?.killCounts : records?.personalBests;
    const key = counter.keys?.find((k) => stored?.[k] !== undefined);
    const value = key !== undefined ? stored![key]! : null;

    return {
      label: counter.label,
      ...(counter.shortLabel && { shortLabel: counter.shortLabel }),
      type: counter.type,
      value,
    };
  });
}
