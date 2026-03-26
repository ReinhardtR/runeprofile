/**
 * Lightweight profile type for diffing and KV caching.
 * Contains only the raw data needed for change detection — no enrichment.
 */
export type DiffProfile = {
  username: string;
  updatedAt: string;
  achievementDiaryTiers: Array<{
    areaId: number;
    tierIndex: number;
    completedCount: number;
  }>;
  combatAchievementTiers: Array<{
    id: number;
    completedCount: number;
  }>;
  items: Array<{
    id: number;
    quantity: number;
  }>;
  quests: Array<{
    id: number;
    state: number;
  }>;
  skills: Array<{
    name: string;
    xp: number;
  }>;
};

const DIFF_CACHE_PREFIX = "diff:";
const DIFF_CACHE_TTL = 86400; // 24 hours

export async function getDiffProfileFromCache(
  kv: KVNamespace,
  accountId: string,
): Promise<DiffProfile | null> {
  return kv.get<DiffProfile>(`${DIFF_CACHE_PREFIX}${accountId}`, "json");
}

export async function setDiffProfileCache(
  kv: KVNamespace,
  accountId: string,
  profile: DiffProfile,
): Promise<void> {
  await kv.put(`${DIFF_CACHE_PREFIX}${accountId}`, JSON.stringify(profile), {
    expirationTtl: DIFF_CACHE_TTL,
  });
  console.log(`Diff profile cache set for account ID: ${accountId}`);
}

export async function deleteDiffProfileCache(
  kv: KVNamespace,
  accountId: string,
): Promise<void> {
  await kv.delete(`${DIFF_CACHE_PREFIX}${accountId}`);
}

/**
 * Builds an updated DiffProfile by merging the current cached state with new changes.
 * For new accounts (current = null), builds directly from the updates.
 */
export function buildUpdatedDiffProfile(
  current: DiffProfile | null,
  updatedAt: string,
  updates: {
    username: string;
    achievementDiaryTiers: Array<{
      areaId: number;
      tier: number;
      completedCount: number;
    }>;
    combatAchievementTiers: Array<{
      id: number;
      completedCount: number;
    }>;
    items: Array<{
      id: number;
      quantity: number;
    }>;
    quests: Array<{
      id: number;
      state: number;
    }>;
    skills: Array<{
      name: string;
      xp: number;
    }>;
  },
): DiffProfile {
  if (!current) {
    return {
      username: updates.username,
      updatedAt,
      achievementDiaryTiers: updates.achievementDiaryTiers.map((t) => ({
        areaId: t.areaId,
        tierIndex: t.tier,
        completedCount: t.completedCount,
      })),
      combatAchievementTiers: updates.combatAchievementTiers,
      items: updates.items,
      quests: updates.quests,
      skills: updates.skills,
    };
  }

  // Merge achievement diary tiers
  const diaryMap = new Map(
    current.achievementDiaryTiers.map((t) => [`${t.areaId}:${t.tierIndex}`, t]),
  );
  for (const update of updates.achievementDiaryTiers) {
    diaryMap.set(`${update.areaId}:${update.tier}`, {
      areaId: update.areaId,
      tierIndex: update.tier,
      completedCount: update.completedCount,
    });
  }

  // Merge combat achievement tiers
  const combatMap = new Map(
    current.combatAchievementTiers.map((t) => [t.id, t]),
  );
  for (const update of updates.combatAchievementTiers) {
    combatMap.set(update.id, {
      id: update.id,
      completedCount: update.completedCount,
    });
  }

  // Merge items
  const itemsMap = new Map(current.items.map((i) => [i.id, i]));
  for (const update of updates.items) {
    itemsMap.set(update.id, { id: update.id, quantity: update.quantity });
  }

  // Merge quests
  const questsMap = new Map(current.quests.map((q) => [q.id, q]));
  for (const update of updates.quests) {
    questsMap.set(update.id, { id: update.id, state: update.state });
  }

  // Merge skills
  const skillsMap = new Map(current.skills.map((s) => [s.name, s]));
  for (const update of updates.skills) {
    skillsMap.set(update.name, { name: update.name, xp: update.xp });
  }

  return {
    username: updates.username,
    updatedAt,
    achievementDiaryTiers: [...diaryMap.values()],
    combatAchievementTiers: [...combatMap.values()],
    items: [...itemsMap.values()],
    quests: [...questsMap.values()],
    skills: [...skillsMap.values()],
  };
}
