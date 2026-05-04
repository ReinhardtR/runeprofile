import {
  ACHIEVEMENT_DIARIES,
  ACHIEVEMENT_DIARY_TIER_NAMES,
  type ActivityEvent,
  COLLECTION_LOG_ITEMS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
} from "@runeprofile/runescape";

export const CACHE_HEADER = { "Cache-Control": "public, max-age=60" };

export function enrichActivity(event: ActivityEvent) {
  const enriched: Record<string, string> = {};

  switch (event.type) {
    case "new_item_obtained": {
      const name = COLLECTION_LOG_ITEMS[event.data.itemId];
      if (name) enriched.itemName = name;
      break;
    }
    case "quest_completed": {
      const quest = QUESTS.find((q) => q.id === event.data.questId);
      if (quest) enriched.questName = quest.name;
      break;
    }
    case "achievement_diary_tier_completed": {
      const area = ACHIEVEMENT_DIARIES.find((d) => d.id === event.data.areaId);
      if (area) enriched.areaName = area.name;
      enriched.tierName =
        ACHIEVEMENT_DIARY_TIER_NAMES[event.data.tier] ?? "Unknown";
      break;
    }
    case "combat_achievement_tier_completed": {
      const tier = COMBAT_ACHIEVEMENT_TIERS.find(
        (t) => t.id === event.data.tierId,
      );
      if (tier) enriched.tierName = tier.name;
      break;
    }
    case "valuable_drop": {
      const name = COLLECTION_LOG_ITEMS[event.data.itemId];
      if (name) enriched.itemName = name;
      break;
    }
  }

  return Object.keys(enriched).length > 0 ? enriched : undefined;
}
