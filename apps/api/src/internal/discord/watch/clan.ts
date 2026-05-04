import { and, eq } from "drizzle-orm";

import { Database, discordWatches } from "@runeprofile/db";

export async function addClanWatch(params: {
  db: Database;
  clanName: string;
  channelId: string;
}) {
  const { db, clanName, channelId } = params;

  await db
    .insert(discordWatches)
    .values({
      id: crypto.randomUUID(),
      channelId,
      targetId: clanName,
      targetType: "clan",
    })
    .onConflictDoNothing();
}

export async function removeClanWatch(params: {
  db: Database;
  clanName: string;
  channelId: string;
}) {
  const { db, clanName, channelId } = params;

  await db
    .delete(discordWatches)
    .where(
      and(
        eq(discordWatches.channelId, channelId),
        eq(discordWatches.targetId, clanName),
        eq(discordWatches.targetType, "clan"),
      ),
    );
}

export async function getClanWatches(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  const watches = await db.query.discordWatches.findMany({
    where: (watches, { eq, and }) =>
      and(eq(watches.channelId, channelId), eq(watches.targetType, "clan")),
  });

  return watches.map((w) => w.targetId);
}
