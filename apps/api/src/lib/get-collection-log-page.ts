import { and, eq, inArray } from "drizzle-orm";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import { Database, accounts } from "~/db";
import { lower } from "~/db/helpers";

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
    throw new Error("Page not found");
  }

  const account = await db.query.accounts.findFirst({
    where: eq(lower(accounts.username), username.toLowerCase()),
    columns: { id: true },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const itemsObtained = await db.query.items.findMany({
    where: (items) =>
      and(eq(items.accountId, account.id), inArray(items.id, page.items)),
    columns: {
      id: true,
      quantity: true,
    },
  });

  return {
    name: page.name,
    items: page.items.map((itemId) => ({
      id: itemId,
      quantity: itemsObtained.find((i) => i.id === itemId)?.quantity || 0,
    })),
  };
}
