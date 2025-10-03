import { Database, accounts, activities } from "@runeprofile/db";

export async function getMetrics(db: Database) {
  const [totalAccounts, totalActivities] = await Promise.all([
    await db.$count(accounts),
    await db.$count(activities),
  ]);

  return {
    totalAccounts,
    totalActivities,
  };
}
