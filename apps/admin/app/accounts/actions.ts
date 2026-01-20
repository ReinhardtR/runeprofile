"use server";

import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, like, sql } from "drizzle-orm";

import {
  achievementDiaryTiers,
  activities,
  combatAchievementTiers,
  items,
  lower,
  quests,
  skills,
} from "@runeprofile/db";
import { accounts } from "@runeprofile/db";

export async function deleteAccount(id: string) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    columns: { username: true },
  });
  if (!account) {
    throw new Error("Account not found");
  }
  await Promise.all([
    db
      .delete(achievementDiaryTiers)
      .where(eq(achievementDiaryTiers.accountId, id)),
    db
      .delete(combatAchievementTiers)
      .where(eq(combatAchievementTiers.accountId, id)),
    db.delete(items).where(eq(items.accountId, id)),
    db.delete(quests).where(eq(quests.accountId, id)),
    db.delete(skills).where(eq(skills.accountId, id)),
    db.delete(activities).where(eq(activities.accountId, id)),
  ]);
  await db.delete(accounts).where(eq(accounts.id, id));

  // Delete player model files from R2 bucket
  const username = account.username.toLowerCase();
  try {
    const { env } = getCloudflareContext();
    await Promise.all([
      env.BUCKET.delete(username),
      env.BUCKET.delete(`${username}-pet`),
    ]);
  } catch (error) {
    console.error("Failed to delete model files:", error);
    // Don't throw - account is already deleted from DB
  }

  return account;
}

export async function updateAccount(
  id: string,
  updates: {
    username?: string;
    clanName?: string | null;
    clanRank?: number | null;
    clanIcon?: number | null;
    clanTitle?: string | null;
    banned?: boolean;
  },
) {

  // Check if account exists
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    columns: { id: true, username: true },
  });
  if (!account) {
    throw new Error("Account not found");
  }

  // If username is being updated, check if it's already taken
  if (updates.username && updates.username !== account.username) {
    const existingAccount = await db.query.accounts.findFirst({
      where: eq(lower(accounts.username), updates.username.toLowerCase()),
      columns: { id: true },
    });

    if (existingAccount && existingAccount.id !== id) {
      throw new Error("Username is already taken");
    }
  }

  // Update the account
  await db.update(accounts).set(updates).where(eq(accounts.id, id));

  // Rename player model files if username changed
  if (updates.username && updates.username !== account.username) {
    const oldKey = account.username.toLowerCase();
    const newKey = updates.username.toLowerCase();

    if (oldKey !== newKey) {
      try {
        const bucket = getCloudflareContext().env.BUCKET;
        await Promise.all([
          renameFile(bucket, oldKey, newKey),
          renameFile(bucket, `${oldKey}-pet`, `${newKey}-pet`),
        ]);
      } catch {
        console.error("Failed to rename model files");
      }
    }
  }

  return { updated: true };
}

async function renameFile(bucket: R2Bucket, oldKey: string, newKey: string) {
  const file = await bucket.get(oldKey);
  if (!file) return;
  const data = await file.arrayBuffer();
  await bucket.put(newKey, data);
  await bucket.delete(oldKey);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function searchAccounts(q: string) {
  const raw = q.trim();
  if (!raw) return [];

  const selectFields = {
    id: accounts.id,
    username: accounts.username,
    banned: accounts.banned,
    clanName: accounts.clanName,
    clanRank: accounts.clanRank,
    clanIcon: accounts.clanIcon,
    clanTitle: accounts.clanTitle,
    updatedAt: accounts.updatedAt,
  };

  // If it looks like a full UUID, search by id.
  if (UUID_REGEX.test(raw)) {
    return db
      .select(selectFields)
      .from(accounts)
      .where(eq(accounts.id, raw))
      .limit(1);
  }

  // If it's a short hex-like (possible id prefix) >=4 chars, attempt prefix match on id.
  if (/^[0-9a-f-]{4,}$/i.test(raw) && raw.length < 36) {
    return db
      .select(selectFields)
      .from(accounts)
      .where(like(accounts.id, `${raw}%`))
      .limit(25);
  }

  // Otherwise treat as username substring search (case-insensitive).
  // Order by: exact match first, then prefix matches, then substring matches.
  const term = raw.toLowerCase();
  return db
    .select(selectFields)
    .from(accounts)
    .where(sql`lower(${accounts.username}) like ${`%${term}%`}`)
    .orderBy(
      sql`CASE
        WHEN lower(${accounts.username}) = ${term} THEN 0
        WHEN lower(${accounts.username}) LIKE ${`${term}%`} THEN 1
        ELSE 2
      END`,
      accounts.username,
    )
    .limit(25);
}
