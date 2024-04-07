import React, { Suspense } from "react";

import { isValidTab } from "~/lib/constants/collection-log";
import { getAvailableCollectionLogPages } from "~/lib/data/collection-log";
import { type CollectionLog as CollectionLogType } from "~/lib/domain/profile-data-types";
import { Card } from "~/components/card";

import { CollectionLogContent, CollectionLogFormatted } from "./content";

type CollectionLogProps = {
  username: string;
  collectionLog: CollectionLogType;
};

const initialTabs: CollectionLogFormatted["tabs"] = {
  bosses: {
    displayName: "Bosses",
    pages: {},
  },
  raids: {
    displayName: "Raids",
    pages: {},
  },
  clues: {
    displayName: "Clues",
    pages: {},
  },
  minigames: {
    displayName: "Minigames",
    pages: {},
  },
  other: {
    displayName: "Other",
    pages: {},
  },
};

export const CollectionLog = async ({
  username,
  collectionLog: collectionLogData,
}: CollectionLogProps) => {
  const availablePages = await getAvailableCollectionLogPages();

  const collectionLog: CollectionLogFormatted = {
    uniqueItemsObtained: collectionLogData.uniqueItemsObtained,
    uniqueItemsTotal: collectionLogData.uniqueItemsTotal,
    tabs: initialTabs,
  };

  for (const page of availablePages) {
    const tabName = page.tab.toLowerCase();
    if (!isValidTab(tabName)) {
      continue;
    }

    const tab = collectionLog.tabs[tabName];

    tab.pages[page.name.toLowerCase()] = {
      displayName: page.name,
      kcs: page.kcs.map((kc) => ({
        label: kc.label,
        count: -1,
        orderIdx: kc.orderIdx,
      })),
      items: [],
    };
  }

  for (const tab of collectionLogData.tabs) {
    const tabName = tab.name.toLowerCase();
    if (!isValidTab(tabName)) {
      continue;
    }

    for (const page of tab.pages) {
      const currentPage =
        collectionLog.tabs[tabName].pages[page.name.toLowerCase()];
      if (!currentPage) continue;

      for (const kc of page.killCounts) {
        const currentKc = currentPage.kcs.find((k) => k.label === kc.label);
        if (!currentKc) continue;
        currentKc.count = kc.count;
      }

      for (const itemId of page.itemIds) {
        const item = collectionLogData.items.find((i) => i.id === itemId);
        if (!item) continue;
        currentPage.items.push(item);
      }
    }
  }

  console.log("COLLECTION LOG ROOT");
  return (
    <Suspense
      fallback={
        <Card
          iconPath="/assets/icons/collection-log.png"
          className="w-[260px] sm:w-full md:w-[640px]"
        />
      }
    >
      <CollectionLogContent username={username} collectionLog={collectionLog} />
    </Suspense>
  );
};
