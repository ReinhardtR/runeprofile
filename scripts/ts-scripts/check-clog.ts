import * as cache from "@abextm/cache2";

import { COLLECTION_LOG_TABS, CollectionLogPage } from "@runeprofile/runescape";

const CLOG_GROUPS = 2102 as cache.ParamID;
const CLOG_TAB_ENUM = 683 as cache.ParamID;
const CLOG_TAB_NAME = 682 as cache.ParamID;
const CLOG_PAGE_NAME = 689 as cache.ParamID;
const CLOG_ITEM_ENUM = 690 as cache.ParamID;

// Some items have "dummy" items with different IDs in the cache.
// key = dummy item ID, value = actual item ID
// key is the one used in runeprofile
const CLOG_DUMMY_ITEM_ID_MAP: Record<number, number> = {
  12013: 29472, // Prospector helmet
  12014: 29474, // Prospector jacket
  12015: 29476, // Prospector legs
  12016: 29478, // Prospector boots
  25617: 10859, // Tea flask
  25618: 10877, // Plain satchel
  25619: 10878, // Green satchel
  25620: 10879, // Red satchel
  25621: 10880, // Black satchel
  25622: 10881, // Gold satchel
  25623: 10882, // Rune satchel
  25624: 13273, // Unsired
  25627: 12019, // Coal bag
  25628: 12020, // Gem bag
  25629: 24882, // Plank sack
  25630: 12854, // Flamtaer bag
  29992: 29990, // Alchemist's amulet
  30805: 30803, // Dossier
};

checkClog()
  .then(() => console.log("Finished checking collection log."))
  .catch((error) => console.error("Error:", error));

async function checkClog() {
  const provider = new cache.FlatCacheProvider({
    getFile: async (name) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/abextm/osrs-cache/master/${name}`,
      );
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
  });

  const tabsEnum = await cache.Enum.load(provider, CLOG_GROUPS);
  if (!tabsEnum) {
    throw new Error("Failed to load collection log tabs enum.");
  }

  // tabs enum map values to an array of tab IDs
  const tabIds = [...tabsEnum.map.values()];

  const pagesWithChanges: {
    tab: string;
    page: CollectionLogPage;
    isNew: boolean;
  }[] = [];

  for (const tabId of tabIds) {
    const tabStruct = await cache.Struct.load(provider, tabId);
    if (!tabStruct) {
      throw new Error(
        `Failed to load collection log tab struct for ID: ${tabId}`,
      );
    }

    const tabName = tabStruct.params.get(CLOG_TAB_NAME);
    if (!tabName) {
      throw new Error(
        `Failed to load collection log tab name for ID: ${CLOG_TAB_NAME}`,
      );
    }

    const tabValues = await cache.Enum.load(
      provider,
      tabStruct.params.get(CLOG_TAB_ENUM),
    );
    if (!tabValues) {
      throw new Error(
        `Failed to load collection log tab values for ID: ${tabStruct.params.get(CLOG_TAB_ENUM)}`,
      );
    }

    const existingTab = COLLECTION_LOG_TABS.find((tab) => tab.name === tabName);

    const pageIds = [...tabValues.map.values()];
    for (const pageId of pageIds) {
      const pageStruct = await cache.Struct.load(provider, pageId);
      if (!pageStruct) {
        throw new Error(
          `Failed to load collection log page struct for ID: ${pageId}`,
        );
      }

      const pageName = await pageStruct.params.get(CLOG_PAGE_NAME);
      if (!pageName) {
        throw new Error(
          `Failed to load collection log page name for ID: ${CLOG_PAGE_NAME}`,
        );
      }

      const itemsEnum = pageStruct.params.get(CLOG_ITEM_ENUM);
      if (!itemsEnum) {
        throw new Error(
          `Failed to load collection log items enum for ID: ${CLOG_ITEM_ENUM}`,
        );
      }

      const itemIdsEnum = await cache.Enum.load(provider, itemsEnum);
      if (!itemIdsEnum) {
        throw new Error(
          `Failed to load collection log item IDs for enum ID: ${itemsEnum}`,
        );
      }

      const itemIds = [...itemIdsEnum.map.values()];

      const existingPage = existingTab?.pages.find(
        (page) => page.name === pageName,
      );

      if (!existingPage) {
        // New page
        console.log(
          `New collection log page found: ${pageName} in tab ${tabName}`,
        );
        pagesWithChanges.push({
          tab: tabName as string,
          page: {
            name: pageName as string,
            items: itemIds as number[],
          },
          isNew: true,
        });
      } else {
        // Check for new items in existing page
        const newItems = itemIds.filter((newItemId) => {
          // Check if this item (or its real/dummy counterpart) already exists
          const realItemId =
            CLOG_DUMMY_ITEM_ID_MAP[newItemId as number] || newItemId;
          const dummyItemId = Object.keys(CLOG_DUMMY_ITEM_ID_MAP).find(
            (dummyId) => CLOG_DUMMY_ITEM_ID_MAP[Number(dummyId)] === newItemId,
          );

          return !existingPage.items?.some((existingItemId) => {
            // An item is considered "existing" if either:
            // 1. The exact ID matches
            // 2. The real item ID matches (for dummy items)
            // 3. The dummy item ID matches (for real items)
            return (
              existingItemId === newItemId ||
              existingItemId === realItemId ||
              (dummyItemId && existingItemId === Number(dummyItemId))
            );
          });
        });

        if (newItems.length > 0) {
          console.log(
            `New collection log items found in page ${pageName} (ID: ${pageId}) of tab ${tabName} (ID: ${tabId}): ${newItems.join(", ")}`,
          );

          pagesWithChanges.push({
            tab: tabName as string,
            page: {
              ...existingPage,
              items: [
                ...(existingPage.items || []),
                ...(newItems as number[]),
              ].sort((a, b) => a - b),
            },
            isNew: false,
          });
        }
      }
    }
  }

  // Output the page objects
  if (pagesWithChanges.length > 0) {
    console.log("\n=== COPY-PASTE PAGE OBJECTS ===\n");
    for (const { tab, page, isNew } of pagesWithChanges) {
      console.log(`// ${isNew ? "NEW" : "UPDATED"} page in tab: ${tab}`);
      console.log(JSON.stringify(page, null, 2) + ",");
      console.log(""); // Empty line between pages
    }
  } else {
    console.log("No changes found in collection log data.");
  }
}
