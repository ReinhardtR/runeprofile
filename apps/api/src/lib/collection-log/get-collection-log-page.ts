import { and, eq, inArray } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import { COLLECTION_LOG_TABS, getLogCounters } from "@runeprofile/runescape";

import {
  getBossRecords,
  resolvePageCounters,
} from "~/lib/boss-records/boss-records";
import {
  RuneProfileAccountNotFoundError,
  RuneProfileClogPageNotFoundError,
  RuneProfileError,
} from "~/lib/errors";

export async function getCollectionLogPage(
  db: Database,
  username: string,
  pageName: string,
) {
  const page = COLLECTION_LOG_TABS.map((tab) => tab.pages)
    .flat()
    .find((p) => {
      return (
        p.name.toLowerCase() === pageName.toLowerCase() ||
        p.aliases?.some(
          (alias) => alias.toLowerCase() === pageName.toLowerCase(),
        )
      );
    });

  if (!page) {
    throw RuneProfileClogPageNotFoundError;
  }

  const account = await db.query.accounts.findFirst({
    where: eq(lower(accounts.username), username.toLowerCase()),
    columns: { id: true },
  });

  if (!account) {
    throw new RuneProfileError(
      RuneProfileAccountNotFoundError.status,
      RuneProfileAccountNotFoundError.code,
      RuneProfileAccountNotFoundError.message +
        " Click RuneProfile button in the Collection Log window - A guide can be found on the website.",
    );
  }

  const [itemsObtainedChunks, { counters, logCounters }] = await Promise.all([
    db.query.items.findMany({
      where: (items) =>
        and(eq(items.accountId, account.id), inArray(items.id, page.items)),
      columns: {
        id: true,
        quantity: true,
      },
    }),
    // Kill counts are extra: a failure here must not take the page down.
    getPageCounters(db, account, page).catch((err) => {
      console.error("Failed to resolve collection log counters:", err);
      return { counters: [], logCounters: [] };
    }),
  ]);

  const itemsObtained = itemsObtainedChunks.flat();

  return {
    name: page.name,
    items: page.items.map((itemId) => ({
      id: itemId,
      quantity: itemsObtained.find((i) => i.id === itemId)?.quantity || 0,
    })),
    counters,
    // The plugin's !log reply: our chosen kill counts and order, not the page's
    logCounters,
  };
}

// Only what the plugin uploaded: no hiscores lookup, so !log stays fast and cheap.
async function getPageCounters(
  db: Database,
  account: { id: string },
  page: (typeof COLLECTION_LOG_TABS)[number]["pages"][number],
) {
  if (!page.counters?.length) return { counters: [], logCounters: [] };

  const records = await getBossRecords(db, account.id);
  const counters = resolvePageCounters(page, records);
  const logCounters = getLogCounters(page).map(
    (counter) => counters[page.counters!.indexOf(counter)]!,
  );
  return { counters, logCounters };
}
