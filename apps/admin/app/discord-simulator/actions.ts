"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { desc, eq, sql } from "drizzle-orm";

import { accounts, activities } from "@runeprofile/db";
import { type ActivityEvent } from "@runeprofile/runescape";

// ── Account search ──────────────────────────────────────────────────────

export async function searchAccountsForSimulator(query: string) {
  await requireAdmin();

  const raw = query.trim();
  if (!raw) return [];

  const term = raw.toLowerCase();
  return db
    .select({
      id: accounts.id,
      username: accounts.username,
      accountType: accounts.accountType,
      clanName: accounts.clanName,
    })
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
    .limit(10);
}

// ── Fetch recent activities ─────────────────────────────────────────────

export async function getRecentActivities(accountId: string) {
  await requireAdmin();

  return db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(eq(activities.accountId, accountId))
    .orderBy(desc(activities.createdAt))
    .limit(50);
}

// ── Send embeds via the API's /simulate/discord endpoint ────────────────

export async function sendDiscordEmbeds(params: {
  channelId: string;
  activities: ActivityEvent[];
  rsn: string;
  accountType?: number;
}) {
  await requireAdmin();

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error(
      "API_URL is not configured. Add it to your environment variables (e.g. http://localhost:8787).",
    );
  }

  const res = await fetch(`${apiUrl}/simulate/discord`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body as { message?: string })?.message ??
      `API error (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<{ sent: number }>;
}
