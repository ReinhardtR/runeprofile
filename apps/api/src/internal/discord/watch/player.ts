import { and, eq } from "drizzle-orm";

import { Database, discordWatches, lower } from "@runeprofile/db";

import { RuneProfileAccountNotFoundError } from "~/lib/errors";

export async function addPlayerWatch(params: {
  db: Database;
  rsn: string;
  channelId: string;
}) {
  const { db, rsn, channelId } = params;

  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) =>
      eq(lower(accounts.username), rsn.toLowerCase()),
  });

  if (!account) {
    throw RuneProfileAccountNotFoundError;
  }

  await db
    .insert(discordWatches)
    .values({
      id: crypto.randomUUID(),
      channelId,
      targetId: account.id,
      targetType: "player",
    })
    .onConflictDoNothing();
}

export async function removePlayerWatch(params: {
  db: Database;
  rsn: string;
  channelId: string;
}) {
  const { db, rsn, channelId } = params;

  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) =>
      eq(lower(accounts.username), rsn.toLowerCase()),
  });

  if (!account) {
    throw RuneProfileAccountNotFoundError;
  }

  await db
    .delete(discordWatches)
    .where(
      and(
        eq(discordWatches.channelId, channelId),
        eq(discordWatches.targetId, account.id),
        eq(discordWatches.targetType, "player"),
      ),
    );
}

export async function getPlayerWatches(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  const watchesWithTargetAccount = await db.query.discordWatches.findMany({
    where: (watches, { eq, and }) =>
      and(eq(watches.channelId, channelId), eq(watches.targetType, "player")),
    with: {
      targetAccount: {
        columns: {
          username: true,
        },
      },
    },
  });

  return watchesWithTargetAccount.map((w) => w.targetAccount.username);
}
