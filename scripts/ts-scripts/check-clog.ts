import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cache from "@abextm/cache2";
import { Project, SyntaxKind } from "ts-morph";

import {
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_TABS,
  CollectionLogPage,
} from "@runeprofile/runescape";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COLLECTION_LOG_PATH = path.resolve(
  __dirname,
  "../../packages/runescape/src/collection-log.ts",
);

const writeMode = process.argv.includes("--write");

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

  const newItems: Record<number, string> = {};
  const changedItemNames: Array<{
    id: number;
    oldName: string;
    newName: string;
  }> = [];

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

      // Check for new items and name changes
      for (const itemId of itemIds) {
        const realItemId = CLOG_DUMMY_ITEM_ID_MAP[itemId as number] || itemId;
        const runeprofileItemId = itemId as number; // The ID used in runeprofile

        // Check if this real item ID is represented by a dummy ID in runeprofile
        const dummyIdForRealItem = Object.keys(CLOG_DUMMY_ITEM_ID_MAP).find(
          (dummyId) => CLOG_DUMMY_ITEM_ID_MAP[Number(dummyId)] === realItemId,
        );

        // Use the dummy ID if it exists, otherwise use the runeprofile item ID
        const itemIdToCheck = dummyIdForRealItem
          ? Number(dummyIdForRealItem)
          : runeprofileItemId;

        // Get item name from cache (use real item ID for cache lookup)
        const itemDef = await cache.Item.load(provider, realItemId as number);
        const itemName = itemDef?.name;

        if (itemName) {
          // Check if this is a completely new item (use the appropriate ID for lookup)
          if (!COLLECTION_LOG_ITEMS[itemIdToCheck]) {
            newItems[itemIdToCheck] = itemName;
          } else {
            // Check if the name has changed (use the appropriate ID for lookup)
            const existingName = COLLECTION_LOG_ITEMS[itemIdToCheck];
            if (existingName !== itemName) {
              changedItemNames.push({
                id: itemIdToCheck,
                oldName: existingName,
                newName: itemName,
              });
            }
          }
        }
      }
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

  const hasChanges =
    pagesWithChanges.length > 0 ||
    Object.keys(newItems).length > 0 ||
    changedItemNames.length > 0;

  if (!hasChanges) {
    console.log("No changes found in collection log data.");
    return;
  }

  // Build change summary
  const summary = buildChangeSummary(
    pagesWithChanges,
    newItems,
    changedItemNames,
  );
  console.log(summary);

  if (writeMode) {
    writeChanges(pagesWithChanges, newItems, changedItemNames);

    // Write summary file for GitHub Actions
    const summaryPath = path.join("/tmp", "clog-changes-summary.txt");
    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`\nChange summary written to ${summaryPath}`);
  } else {
    // Output copy-paste blocks for manual use
    if (pagesWithChanges.length > 0) {
      console.log("\n=== COPY-PASTE PAGE OBJECTS ===\n");
      for (const { tab, page, isNew } of pagesWithChanges) {
        console.log(`// ${isNew ? "NEW" : "UPDATED"} page in tab: ${tab}`);
        console.log(JSON.stringify(page, null, 2) + ",");
        console.log("");
      }
    }

    if (Object.keys(newItems).length > 0 || changedItemNames.length > 0) {
      console.log("\n=== COLLECTION_LOG_ITEMS UPDATES ===\n");

      if (Object.keys(newItems).length > 0) {
        console.log("// NEW ITEMS - Add these to COLLECTION_LOG_ITEMS:");
        const sortedNewItems = Object.entries(newItems).sort(
          ([a], [b]) => Number(a) - Number(b),
        );
        for (const [id, name] of sortedNewItems) {
          console.log(`  ${id}: "${name}",`);
        }
        console.log("");
      }

      if (changedItemNames.length > 0) {
        console.log(
          "// NAME CHANGES - Update these in COLLECTION_LOG_ITEMS:",
        );
        const sortedChangedItems = changedItemNames.sort(
          (a, b) => a.id - b.id,
        );
        for (const { id, oldName, newName } of sortedChangedItems) {
          console.log(`  ${id}: "${newName}", // was: "${oldName}"`);
        }
        console.log("");
      }
    }
  }
}

function buildChangeSummary(
  pagesWithChanges: { tab: string; page: CollectionLogPage; isNew: boolean }[],
  newItems: Record<number, string>,
  changedItemNames: Array<{ id: number; oldName: string; newName: string }>,
): string {
  const lines: string[] = ["## Collection Log Update Summary\n"];

  const newPages = pagesWithChanges.filter((p) => p.isNew);
  const updatedPages = pagesWithChanges.filter((p) => !p.isNew);

  if (newPages.length > 0) {
    lines.push(`### New Pages (${newPages.length})\n`);
    for (const { tab, page } of newPages) {
      lines.push(
        `- **${page.name}** in tab *${tab}* (${page.items.length} items)`,
      );
    }
    lines.push("");
    lines.push(
      "> **Note:** New pages need manual additions for `hiscore` and `aliases` properties.\n",
    );
  }

  if (updatedPages.length > 0) {
    lines.push(`### Updated Pages (${updatedPages.length})\n`);
    for (const { tab, page } of updatedPages) {
      lines.push(`- **${page.name}** in tab *${tab}*`);
    }
    lines.push("");
  }

  const newItemEntries = Object.entries(newItems).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  if (newItemEntries.length > 0) {
    lines.push(`### New Items (${newItemEntries.length})\n`);
    for (const [id, name] of newItemEntries) {
      lines.push(`- \`${id}\`: ${name}`);
    }
    lines.push("");
  }

  if (changedItemNames.length > 0) {
    const sorted = [...changedItemNames].sort((a, b) => a.id - b.id);
    lines.push(`### Item Name Changes (${sorted.length})\n`);
    for (const { id, oldName, newName } of sorted) {
      lines.push(`- \`${id}\`: ~~${oldName}~~ → ${newName}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function writeChanges(
  pagesWithChanges: { tab: string; page: CollectionLogPage; isNew: boolean }[],
  newItems: Record<number, string>,
  changedItemNames: Array<{ id: number; oldName: string; newName: string }>,
) {
  console.log(`\nWriting changes to ${COLLECTION_LOG_PATH}...`);

  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });
  const sourceFile = project.addSourceFileAtPath(COLLECTION_LOG_PATH);

  // --- Update COLLECTION_LOG_ITEMS ---
  const itemsDecl = sourceFile.getVariableDeclarationOrThrow(
    "COLLECTION_LOG_ITEMS",
  );
  const itemsObj = itemsDecl.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  // Apply name changes
  for (const { id, newName } of changedItemNames) {
    const prop = itemsObj.getProperty(String(id));
    if (prop && prop.isKind(SyntaxKind.PropertyAssignment)) {
      prop.setInitializer(`"${newName.replace(/"/g, '\\"')}"`);
    }
  }

  // Add new items
  for (const [id, name] of Object.entries(newItems)) {
    itemsObj.addPropertyAssignment({
      name: id,
      initializer: `"${name.replace(/"/g, '\\"')}"`,
    });
  }

  // Sort all properties by numeric key
  const allProps = itemsObj.getProperties();
  const propData = allProps.map((prop) => ({
    name: prop.isKind(SyntaxKind.PropertyAssignment)
      ? prop.getName()
      : prop.getText(),
    text: prop.getText(),
  }));
  propData.sort((a, b) => Number(a.name) - Number(b.name));

  // Remove all and re-add sorted
  for (const prop of allProps) {
    prop.remove();
  }
  for (const { name, text } of propData) {
    const match = text.match(/:\s*(.*)/s);
    const initializer = match?.[1] ?? `""`;
    itemsObj.addPropertyAssignment({
      name,
      initializer,
    });
  }

  // --- Update COLLECTION_LOG_TABS ---
  const tabsDecl = sourceFile.getVariableDeclarationOrThrow(
    "COLLECTION_LOG_TABS",
  );
  const tabsArray = tabsDecl.getInitializerIfKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  for (const { tab: tabName, page, isNew } of pagesWithChanges) {
    // Find the tab object in the array
    const tabElement = tabsArray.getElements().find((el) => {
      if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) return false;
      const nameProp = el.getProperty("name");
      if (!nameProp || !nameProp.isKind(SyntaxKind.PropertyAssignment))
        return false;
      const init = nameProp.getInitializer();
      return init?.getText() === `"${tabName}"`;
    });

    if (!tabElement || !tabElement.isKind(SyntaxKind.ObjectLiteralExpression)) {
      console.warn(`Could not find tab "${tabName}" in COLLECTION_LOG_TABS`);
      continue;
    }

    const pagesProp = tabElement.getPropertyOrThrow("pages");
    if (!pagesProp.isKind(SyntaxKind.PropertyAssignment)) continue;
    const pagesArray = pagesProp.getInitializerIfKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );

    if (isNew) {
      // Add new page to the tab's pages array
      const itemsStr = `[${page.items.join(", ")}]`;
      pagesArray.addElement(
        `{\n  name: "${page.name}",\n  items: ${itemsStr},\n}`,
      );
    } else {
      // Update existing page's items array
      const pageElement = pagesArray.getElements().find((el) => {
        if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) return false;
        const nameProp = el.getProperty("name");
        if (!nameProp || !nameProp.isKind(SyntaxKind.PropertyAssignment))
          return false;
        const init = nameProp.getInitializer();
        return init?.getText() === `"${page.name}"`;
      });

      if (
        !pageElement ||
        !pageElement.isKind(SyntaxKind.ObjectLiteralExpression)
      ) {
        console.warn(
          `Could not find page "${page.name}" in tab "${tabName}"`,
        );
        continue;
      }

      const itemsProp = pageElement.getPropertyOrThrow("items");
      if (!itemsProp.isKind(SyntaxKind.PropertyAssignment)) continue;
      const itemsStr = `[${page.items.join(", ")}]`;
      itemsProp.setInitializer(itemsStr);
    }
  }

  sourceFile.saveSync();
  console.log("File saved.");

  // Run prettier
  console.log("Running prettier...");
  execSync(`pnpm prettier --write "${COLLECTION_LOG_PATH}"`, {
    cwd: path.resolve(__dirname, "../.."),
    stdio: "inherit",
  });
  console.log("Prettier formatting complete.");
}
