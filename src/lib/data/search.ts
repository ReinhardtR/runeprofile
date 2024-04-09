"use server";

import { like } from "drizzle-orm";

import { db } from "~/db";
import { accounts } from "~/db/schema";

export async function searchAccounts(query: string): Promise<string[]> {
  const accountsResult = await db
    .select({
      username: accounts.username,
    })
    .from(accounts)
    .where(like(accounts.username, `%${query}%`))
    .orderBy(accounts.username)
    .limit(10);

  return accountsResult.map((account) => account.username);
}
