import * as cache from "@abextm/cache2";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";
import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

const CLOG_GROUPS = 2102 as cache.ParamID;
const CLOG_TAB_ENUM = 683 as cache.ParamID;
const CLOG_TAB_NAME = 682 as cache.ParamID;
const CLOG_PAGE_NAME = 689 as cache.ParamID;
const CLOG_ITEM_ENUM = 690 as cache.ParamID;

generateClog()
  .then(() => console.log("Finished generating collection log JSON."))
  .catch((error) => console.error("Error:", error));

async function generateClog() {
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

      // loop through the COLLECTION_LOG_TABS and its pages to find what new pages/items are in the cache.
      // if there is a new page or a new item in a existing page, log the page name and the items in it.
      // ALSO log what page is before it, so we know where to position it.
      // ONLY DO CONSOLE LOGS, DONT CHANGE THE COLLECTION_LOG_TABS OR COLLECTION_LOG_ITEMS.
      const existingTab = COLLECTION_LOG_TABS.find(
        (tab) => tab.name === tabName,
      );
      if (!existingTab) {
        console.log(`New collection log tab found: ${tabName}`);
      }

      const existingPage = existingTab?.pages.find(
        (page) => page.name === pageName,
      );
      if (!existingPage) {
        console.log(
          `New collection log page found: ${pageName} in tab ${tabName}`,
        );
      }

      const newItems = itemIds.filter(
        (newItemId) =>
          !existingPage?.items?.some(
            (existingItemId) => existingItemId === newItemId,
          ),
      );
      if (newItems.length > 0) {
        console.log(
          `New collection log items found in page ${pageName} (ID: ${pageId}) of tab ${tabName} (ID: ${tabId}): ${newItems.join(", ")}`,
        );
      }
    }
  }
}
