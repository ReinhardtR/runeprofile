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
