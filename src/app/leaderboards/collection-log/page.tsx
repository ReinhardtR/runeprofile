import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { accClogItems, accounts } from "~/db/schema";

const pageLimit = 10;

const getPaginationData = unstable_cache(
  async (pageNumber: number) => {
    const page = await db
      .select({
        username: accounts.username,
        modelUri: accounts.modelUri,
        uniqueItemsObtained: count(accClogItems.obtainedAt).as(
          "unique_items_obtained"
        ),
        totalAccounts: sql<number>`${db
          .select({
            count: count(),
          })
          .from(accounts)}`,
      })
      .from(accounts)
      .leftJoin(
        accClogItems,
        eq(accounts.accountHash, accClogItems.accountHash)
      )
      .groupBy(accClogItems.accountHash)
      .orderBy(desc(sql`unique_items_obtained`))
      .limit(pageLimit)
      .offset((pageNumber - 1) * pageLimit);

    const totalAccounts = page.length > 0 ? page[0]!.totalAccounts : 0;

    return {
      page: pageNumber,
      limit: pageLimit,
      total: totalAccounts,
      data: page.map((row) => ({
        username: row.username,
        modelUri: row.modelUri,
        uniqueItemsObtained: row.uniqueItemsObtained,
      })),
    };
  },
  [`collection-log-leaderboard-page`],
  {
    revalidate: 60 * 60, // 1 hour
  }
);

export default async function CollectionLeaderboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageNumber =
    typeof searchParams.page === "string" ? Number(searchParams.page) : 1;

  const pagination = await getPaginationData(pageNumber);
  const totalPages = Math.max(Math.ceil(pagination.total / pageLimit), 1);

  // ensure page is within bounds
  if (pageNumber < 1) {
    redirect(`/leaderboards/collection-log?page=1`);
  } else if (pageNumber > totalPages) {
    redirect(`/leaderboards/collection-log?page=${totalPages}`);
  }

  return (
    <div>
      <pre className="text-primary-foreground">
        {JSON.stringify(pagination, null, 2)}
      </pre>
    </div>
  );
}
