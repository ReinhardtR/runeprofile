"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

import { apiKeys } from "@runeprofile/db";

export async function getApiKeys() {
  return db.query.apiKeys.findMany({
    columns: {
      id: true,
      name: true,
      tier: true,
      active: true,
      createdAt: true,
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKey(name: string, tier: string) {
  const id = crypto.randomUUID();
  const rawKey = `rp_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = await hashKey(rawKey);

  await db.insert(apiKeys).values({
    id,
    keyHash,
    name,
    tier,
    active: true,
  });

  // Return the raw key only on creation — it cannot be retrieved later
  return { id, rawKey };
}

export async function toggleApiKeyActive(id: string) {
  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, id),
    columns: { id: true, active: true },
  });
  if (!key) throw new Error("API key not found");

  const newActive = !key.active;
  await db.update(apiKeys).set({ active: newActive }).where(eq(apiKeys.id, id));
  return { active: newActive };
}

export async function deleteApiKey(id: string) {
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}
