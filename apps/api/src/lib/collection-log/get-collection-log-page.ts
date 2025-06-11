import { and, eq, inArray } from "drizzle-orm";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import { Database, accounts } from "~/db";
import { autochunk, lower } from "~/db/helpers";
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

  const itemsObtainedChunks = await Promise.all(
    autochunk({ items: page.items, otherParametersCount: 1 }, (chunk) =>
      db.query.items.findMany({
        where: (items) =>
          and(eq(items.accountId, account.id), inArray(items.id, chunk)),
        columns: {
          id: true,
          quantity: true,
        },
      }),
    ),
  );

  const itemsObtained = itemsObtainedChunks.flat();

  return {
    name: page.name,
    items: page.items.map((itemId) => ({
      id: itemId,
      quantity: itemsObtained.find((i) => i.id === itemId)?.quantity || 0,
    })),
  };
}
