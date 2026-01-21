import { HiscoreData } from "@runeprofile/runescape";

import { Group } from "~/core/api";

type GroupMember = Group["members"][number];

export function mergeGroupItems(members: GroupMember[]) {
  const itemMap = new Map<
    number,
    {
      totalQuantity: number;
      distribution: { username: string; quantity: number }[];
    }
  >();

  // Aggregate items across all members (alphabetically sorted)
  for (const member of members) {
    for (const item of member.items) {
      const existing = itemMap.get(item.id);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.distribution.push({
          username: member.username,
          quantity: item.quantity,
        });
      } else {
        itemMap.set(item.id, {
          totalQuantity: item.quantity,
          distribution: [
            {
              username: member.username,
              quantity: item.quantity,
            },
          ],
        });
      }
    }
  }

  // Convert to arrays
  const items = Array.from(itemMap.entries()).map(([id, data]) => ({
    id,
    name: "", // Will be filled by collection log component
    quantity: data.totalQuantity,
    createdAt: new Date().toISOString(), // Not really relevant for group view
  }));

  const distribution = new Map<
    number,
    { username: string; quantity: number }[]
  >();
  for (const [id, data] of itemMap.entries()) {
    // Filter out 0 quantity entries and sort alphabetically
    const filtered = data.distribution
      .filter((d) => d.quantity > 0)
      .sort((a, b) => a.username.localeCompare(b.username));
    if (filtered.length > 0) {
      distribution.set(id, filtered);
    }
  }

  return {
    items,
    distribution,
  };
}

export function aggregateGroupHiscores(
  hiscoresMap: Record<string, HiscoreData | null>,
  page: { hiscore?: Record<string, string> },
) {
  if (!page.hiscore) {
    return {
      killCounts: [],
      distribution: new Map<string, { username: string; count: number }[]>(),
    };
  }

  const kcMap = new Map<
    string,
    { totalCount: number; distribution: { username: string; count: number }[] }
  >();

  // Get usernames in alphabetical order
  const usernames = Object.keys(hiscoresMap).sort((a, b) => a.localeCompare(b));

  // For each KC label in the page
  for (const [hiscoreName, kcLabel] of Object.entries(page.hiscore)) {
    const distribution: { username: string; count: number }[] = [];
    let totalCount = 0;

    // Aggregate KC across all members
    for (const username of usernames) {
      const hiscores = hiscoresMap[username];

      if (!hiscores) {
        // Failed to fetch hiscores for this player
        distribution.push({
          username,
          count: -1,
        });
        continue;
      }

      const activity = hiscores.activities.find((a) => a.name === hiscoreName);

      const count = activity && activity.score >= 1 ? activity.score : 0;

      distribution.push({
        username,
        count,
      });

      if (count > 0) {
        totalCount += count;
      }
    }

    kcMap.set(kcLabel, {
      totalCount,
      distribution,
    });
  }

  // Convert to result format
  const killCounts = Array.from(kcMap.entries()).map(([label, data]) => ({
    label,
    count: data.totalCount,
  }));

  const distribution = new Map<string, { username: string; count: number }[]>();
  for (const [label, data] of kcMap.entries()) {
    distribution.set(label, data.distribution);
  }

  return {
    killCounts,
    distribution,
  };
}

export function getMostCommonClogPage(members: GroupMember[]): string | null {
  const pageCounts = new Map<string, number>();

  for (const member of members) {
    if (member.defaultClogPage) {
      const count = pageCounts.get(member.defaultClogPage) || 0;
      pageCounts.set(member.defaultClogPage, count + 1);
    }
  }

  if (pageCounts.size === 0) {
    return null;
  }

  // Find the most common page
  let mostCommon: string | null = null;
  let maxCount = 0;

  // Sort by page name to ensure deterministic results on ties
  const sortedEntries = Array.from(pageCounts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [page, count] of sortedEntries) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = page;
    }
  }

  return mostCommon;
}
