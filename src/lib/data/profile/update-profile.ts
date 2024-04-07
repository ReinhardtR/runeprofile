import { and, eq, ne, or, sql } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";

import { AccountType } from "~/lib/domain/profile-data-types";
import { type ChangedDataResult } from "~/lib/get-changed-data";
import { db } from "~/db";
import {
  accAchievementDiaries,
  accClogItemObtainedKcs,
  accClogItems,
  accClogKcs,
  accCombatAchievementTiers,
  accHiscoresEntries,
  accounts,
  accQuests,
  accSkills,
  achievementDiaries,
  clogItems,
  clogKcs,
  clogPages,
  clogPagesItems,
  clogPagesKcs,
  combatAchievementTiers,
  hiscoresEntries,
  quests,
  skills,
} from "~/db/schema";

export async function updateProfile({
  accountHash,
  username,
  accountType,
  questPoints,
  changedData,
}: {
  accountHash: string;
  username: string;
  accountType: AccountType;
  questPoints: number;
  changedData: ChangedDataResult;
}) {
  const now = new Date();

  const queries: BatchItem<"sqlite">[] = [];

  // --- UPDATE GAME QUERIES ---
  // update skills
  if (changedData.game.skills.length > 0) {
    console.log("Updating skills", changedData.game.skills);
    queries.push(
      db
        .insert(skills)
        .values(
          changedData.game.skills.map((s) => ({
            name: s.name,
            orderIdx: s.orderIdx,
          }))
        )
        .onConflictDoUpdate({
          target: skills.name,
          set: { orderIdx: sql`excluded.order_idx` },
          where: ne(skills.orderIdx, sql`excluded.order_idx`),
        })
    );
  }

  // update quests
  if (changedData.game.quests.length > 0) {
    console.log("Updating quests", changedData.game.quests);
    queries.push(
      db
        .insert(quests)
        .values(
          changedData.game.quests.map((q) => ({
            name: q.name,
            type: q.type,
            orderIdx: q.orderIdx,
          }))
        )
        .onConflictDoUpdate({
          target: quests.name,
          set: {
            type: sql`excluded.type`,
            orderIdx: sql`excluded.order_idx`,
          },
          where: or(
            ne(quests.type, sql`excluded.type`),
            ne(quests.orderIdx, sql`excluded.order_idx`)
          ),
        })
    );
  }

  // update achievement diaries
  if (changedData.game.achievementDiaries.length > 0) {
    console.log(
      "Updating achievement diaries",
      changedData.game.achievementDiaries
    );
    queries.push(
      db
        .insert(achievementDiaries)
        .values(changedData.game.achievementDiaries)
        .onConflictDoUpdate({
          target: [achievementDiaries.area, achievementDiaries.tier],
          set: { tasksTotal: sql`excluded.tasks_total` },
          where: ne(achievementDiaries.tasksTotal, sql`excluded.tasks_total`),
        })
    );
  }

  // update combat achievements
  if (changedData.game.combatAchievements.length > 0) {
    console.log(
      "Updating combat achievements",
      changedData.game.combatAchievements
    );
    queries.push(
      db
        .insert(combatAchievementTiers)
        .values(
          changedData.game.combatAchievements.map((ca) => ({
            tier: ca.tier,
            tasksTotal: ca.tasksTotal,
          }))
        )
        .onConflictDoUpdate({
          target: combatAchievementTiers.tier,
          set: { tasksTotal: sql`excluded.tasks_total` },
          where: ne(
            combatAchievementTiers.tasksTotal,
            sql`excluded.tasks_total`
          ),
        })
    );
  }

  // update hiscores entries
  if (changedData.game.hiscoresActivities.length > 0) {
    console.log(
      "Updating hiscores entries",
      changedData.game.hiscoresActivities
    );
    queries.push(
      db
        .insert(hiscoresEntries)
        .values(
          changedData.game.hiscoresActivities.map((ha) => ({
            gameMode: ha.gameMode,
            activity: ha.name,
            orderIdx: ha.orderIdx,
          }))
        )
        .onConflictDoUpdate({
          target: [hiscoresEntries.gameMode, hiscoresEntries.activity],
          set: { orderIdx: sql`excluded.order_idx` },
          where: ne(hiscoresEntries.orderIdx, sql`excluded.order_idx`),
        })
    );
  }

  // update collection log pages
  if (changedData.game.collectionLogPages.length > 0) {
    console.log("Updating clog pages", changedData.game.collectionLogPages);
    queries.push(
      db
        .insert(clogPages)
        .values(
          changedData.game.collectionLogPages.map((clp) => ({
            tab: clp.tabName,
            name: clp.pageName,
            orderIdx: clp.orderIdx,
          }))
        )
        .onConflictDoUpdate({
          target: clogPages.name,
          set: { orderIdx: sql`excluded.order_idx` },
          where: ne(clogPages.orderIdx, sql`excluded.order_idx`),
        })
    );
  }

  // update collection log items
  if (changedData.game.collectionLogItems.length > 0) {
    console.log("Updating clog items", changedData.game.collectionLogItems);
    queries.push(
      db
        .insert(clogItems)
        .values(
          changedData.game.collectionLogItems.map((cli) => ({
            id: cli.id,
            name: cli.name,
          }))
        )
        .onConflictDoNothing()
    );
  }

  // update collection log page items
  if (changedData.game.collectionLogPageItems.length > 0) {
    console.log(
      "Updating clog page items",
      changedData.game.collectionLogPageItems
    );
    queries.push(
      db
        .insert(clogPagesItems)
        .values(
          changedData.game.collectionLogPageItems.map((clpi) => ({
            itemId: clpi.itemId,
            orderIdx: clpi.orderIdx,
            pageId: sql`(${db
              .select({ id: clogPages.id })
              .from(clogPages)
              .where(eq(clogPages.name, clpi.pageName))})`,
          }))
        )
        .onConflictDoUpdate({
          target: [clogPagesItems.pageId, clogPagesItems.itemId],
          set: { orderIdx: sql`excluded.order_idx` },
          where: ne(clogPagesItems.orderIdx, sql`excluded.order_idx`),
        })
    );
  }

  // update collection log kcs and page kcs
  if (changedData.game.collectionLogPageKillCounts.length > 0) {
    console.log(
      "Updating clog kcs",
      changedData.game.collectionLogPageKillCounts
    );
    queries.push(
      db
        .insert(clogKcs)
        .values(
          changedData.game.collectionLogPageKillCounts.map((clpkc) => ({
            label: clpkc.label,
          }))
        )
        .onConflictDoNothing()
    );

    queries.push(
      db
        .insert(clogPagesKcs)
        .values(
          changedData.game.collectionLogPageKillCounts.map((clpkc) => ({
            pageId: sql`(${db
              .select({ id: clogPages.id })
              .from(clogPages)
              .where(eq(clogPages.name, clpkc.pageName))})`,
            kcId: sql`(${db
              .select({ id: clogKcs.id })
              .from(clogKcs)
              .where(eq(clogKcs.label, clpkc.label))})`,
            orderIdx: clpkc.orderIdx,
          }))
        )
        .onConflictDoUpdate({
          target: [clogPagesKcs.pageId, clogPagesKcs.kcId],
          set: { orderIdx: sql`excluded.order_idx` },
          where: ne(clogPagesKcs.orderIdx, sql`excluded.order_idx`),
        })
    );
  }

  // --- UPDATE PROFILE QUERIES ---
  // update account
  if (
    changedData.account.account?.accountType ||
    changedData.account.account?.username ||
    changedData.account.questList?.points
  ) {
    console.log(
      "Updating account",
      changedData.account.account,
      changedData.account.questList?.points
    );
    queries.push(
      db
        .insert(accounts)
        .values({
          accountHash,
          accountType: changedData.account.account?.accountType || accountType,
          username: changedData.account.account?.username || username,
          questPoints: changedData.account.questList?.points || questPoints,
        })
        .onConflictDoUpdate({
          target: accounts.accountHash,
          set: {
            username: sql`excluded.username`,
            accountType: sql`excluded.account_type`,
            questPoints: sql`excluded.quest_points`,
          },
          where: or(
            ne(accounts.accountHash, sql`excluded.account_hash`),
            ne(accounts.accountType, sql`excluded.account_type`),
            ne(accounts.questPoints, sql`excluded.quest_points`)
          ),
        })
    );
  }

  // update account skills
  if (changedData.account.skills.length > 0) {
    console.log("Updating account skills", changedData.account.skills);
    queries.push(
      db
        .insert(accSkills)
        .values(
          changedData.account.skills.map((s) => ({
            accountHash,
            xp: s.xp,
            skillId: sql`(${db
              .select({ id: skills.id })
              .from(skills)
              .where(eq(skills.name, s.name))})`,
          }))
        )
        .onConflictDoUpdate({
          target: [accSkills.accountHash, accSkills.skillId],
          set: { xp: sql`excluded.xp` },
          where: ne(accSkills.xp, sql`excluded.xp`),
        })
    );
  }

  // update account quests
  if (changedData.account.quests.length > 0) {
    console.log("Updating account quests", changedData.account.quests);
    queries.push(
      db
        .insert(accQuests)
        .values(
          changedData.account.quests.map((q) => ({
            accountHash,
            questId: sql`(${db
              .select({ id: quests.id })
              .from(quests)
              .where(eq(quests.name, q.name))})`,
            state: q.state,
          }))
        )
        .onConflictDoUpdate({
          target: [accQuests.accountHash, accQuests.questId],
          set: {
            state: sql`excluded.state`,
          },
          where: ne(accQuests.state, sql`excluded.state`),
        })
    );
  }

  // update account achievement diaries
  if (changedData.account.achievementDiaries.length > 0) {
    console.log(
      "Updating account achievement diaries",
      changedData.account.achievementDiaries
    );
    queries.push(
      db
        .insert(accAchievementDiaries)
        .values(
          changedData.account.achievementDiaries.map((ad) => ({
            accountHash,
            tasksCompleted: ad.tasksCompleted,
            diaryId: sql`(${db
              .select({ id: achievementDiaries.id })
              .from(achievementDiaries)
              .where(
                and(
                  eq(achievementDiaries.area, ad.area),
                  eq(achievementDiaries.tier, ad.tier)
                )
              )})`,
          }))
        )
        .onConflictDoUpdate({
          target: [
            accAchievementDiaries.accountHash,
            accAchievementDiaries.diaryId,
          ],
          set: {
            tasksCompleted: sql`excluded.tasks_completed`,
          },
          where: ne(
            accAchievementDiaries.tasksCompleted,
            sql`excluded.tasks_completed`
          ),
        })
    );
  }

  // update account combat achievements
  if (changedData.account.combatAchievements.length > 0) {
    console.log(
      "Updating account combat achievements",
      changedData.account.combatAchievements
    );
    queries.push(
      db
        .insert(accCombatAchievementTiers)
        .values(
          changedData.account.combatAchievements.map((ca) => ({
            accountHash,
            tasksCompleted: ca.tasksCompleted,
            tierId: sql`(${db
              .select({ id: combatAchievementTiers.id })
              .from(combatAchievementTiers)
              .where(eq(combatAchievementTiers.tier, ca.tier))})`,
          }))
        )
        .onConflictDoUpdate({
          target: [
            accCombatAchievementTiers.accountHash,
            accCombatAchievementTiers.tierId,
          ],
          set: {
            tasksCompleted: sql`excluded.tasks_completed`,
          },
          where: ne(
            accCombatAchievementTiers.tasksCompleted,
            sql`excluded.tasks_completed`
          ),
        })
    );
  }

  // Updating account hiscores entries
  if (changedData.account.hiscoresActivities.length > 0) {
    console.log(
      "Updating account hiscores entries",
      changedData.account.hiscoresActivities
    );
    queries.push(
      db
        .insert(accHiscoresEntries)
        .values(
          changedData.account.hiscoresActivities.map((ha) => ({
            accountHash,
            entryId: sql`(${db
              .select({ id: hiscoresEntries.id })
              .from(hiscoresEntries)
              .where(
                and(
                  eq(hiscoresEntries.gameMode, ha.gameMode),
                  eq(hiscoresEntries.activity, ha.name)
                )
              )})`,
            rank: ha.rank,
            score: ha.score,
          }))
        )
        .onConflictDoUpdate({
          target: [accHiscoresEntries.accountHash, accHiscoresEntries.entryId],
          set: { rank: sql`excluded.rank`, score: sql`excluded.score` },
          where: or(
            ne(accHiscoresEntries.rank, sql`excluded.rank`),
            ne(accHiscoresEntries.score, sql`excluded.score`)
          ),
        })
    );
  }

  // update account collection log items
  if (changedData.account.collectionLogItems.length > 0) {
    console.log(
      "Updating account collection log items",
      changedData.account.collectionLogItems
    );
    queries.push(
      db
        .insert(accClogItems)
        .values(
          changedData.account.collectionLogItems.map((item) => ({
            accountHash,
            itemId: item.itemId,
            quantity: item.quantity,
            obtainedAt: item.newlyObtained ? now : undefined,
          }))
        )
        .onConflictDoUpdate({
          target: [accClogItems.accountHash, accClogItems.itemId],
          set: {
            quantity: sql`excluded.quantity`,
            obtainedAt: sql`excluded.obtained_at`,
          },
          where: or(
            ne(accClogItems.quantity, sql`excluded.quantity`),
            ne(accClogItems.obtainedAt, sql`excluded.obtained_at`)
          ),
        })
    );
  }

  // update account collection log kcs
  if (changedData.account.collectionLogPageKillCounts.length > 0) {
    console.log(
      "Updating account collection log kcs",
      changedData.account.collectionLogPageKillCounts
    );
    queries.push(
      db
        .insert(accClogKcs)
        .values(
          changedData.account.collectionLogPageKillCounts.map((kc) => ({
            accountHash,
            kcId: sql`(${db
              .select({ id: clogKcs.id })
              .from(clogKcs)
              .where(eq(clogKcs.label, kc.label))})`,
            count: kc.count,
          }))
        )
        .onConflictDoUpdate({
          target: [accClogKcs.accountHash, accClogKcs.kcId],
          set: { count: sql`excluded.count` },
          where: ne(accClogKcs.count, sql`excluded.count`),
        })
    );
  }

  // update account collection log obtained item kcs
  const newlyObtainedItemsWithKcs =
    changedData.account.collectionLogItems.filter(
      (i) => i.newlyObtained && i.newlyObtained.kcs.length > 0
    );
  if (newlyObtainedItemsWithKcs.length > 0) {
    console.log(
      "Updating account collection log obtained item kcs",
      newlyObtainedItemsWithKcs
    );

    queries.push(
      db
        .insert(accClogItemObtainedKcs)
        .values(
          newlyObtainedItemsWithKcs.flatMap((i) =>
            i.newlyObtained!.kcs.map((kc) => ({
              accountHash,
              itemId: i.itemId,
              kcId: sql`(${db
                .select({ id: clogKcs.id })
                .from(clogKcs)
                .where(eq(clogKcs.label, kc.label))})`,
              count: kc.count,
            }))
          )
        )
        .onConflictDoNothing()
    );
  }

  // execute batch
  if (queries.length > 0) {
    queries.push(
      db
        .update(accounts)
        .set({ updatedAt: now })
        .where(eq(accounts.accountHash, accountHash))
    );

    await db.batch(queries as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  }
}
