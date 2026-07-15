import * as cache from "@abextm/cache2";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

type PageChange = {
  tab: string;
  page: CollectionLogPage;
  isNew: boolean;
  addedItems: number[];
  removedItems: number[];
  reordered: boolean;
};

checkClog()
  .then(() => console.log("Finished checking collection log."))
  .catch((error) => {
    // Fail loudly so the GitHub Action surfaces the error instead of
    // silently exiting 0 and opening no PR.
    console.error("Error:", error);
    process.exitCode = 1;
  });

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

  const pagesWithChanges: PageChange[] = [];

  // The cache's canonical page order for each tab (page names in game order).
  // Used to insert new pages at the right index and to detect when existing
  // pages have drifted out of order.
  const tabPageOrder = new Map<string, string[]>();
  const reorderedTabs: string[] = [];

  // Pages present in the file but gone from the cache (e.g. a page that was
  // merged away or renamed upstream). These get deleted from the file.
  const removedPages: Array<{ tab: string; pageName: string }> = [];

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

    // Page names in the cache's (game) order, collected as we walk the pages.
    const expectedPageNames: string[] = [];

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

      expectedPageNames.push(pageName as string);

      const itemIds = [...itemIdsEnum.map.values()];

      // The page's items in runeprofile's ID convention (dummy IDs where
      // applicable), preserving the cache's in-game ordering.
      const expectedItems: number[] = [];

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

        expectedItems.push(itemIdToCheck);

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
            items: expectedItems,
          },
          isNew: true,
          addedItems: expectedItems,
          removedItems: [],
          reordered: false,
        });
      } else {
        // Compare the existing page against the cache, order-sensitively.
        // expectedItems already uses runeprofile's ID convention, so a plain
        // index-by-index comparison catches added items, removed items and
        // pure reorderings.
        const currentItems = existingPage.items ?? [];
        const addedItems = expectedItems.filter(
          (id) => !currentItems.includes(id),
        );
        const removedItems = currentItems.filter(
          (id) => !expectedItems.includes(id),
        );
        const sameOrder =
          currentItems.length === expectedItems.length &&
          expectedItems.every((id, i) => id === currentItems[i]);
        // Same set of items, different order.
        const reordered =
          !sameOrder && addedItems.length === 0 && removedItems.length === 0;

        if (!sameOrder) {
          const details: string[] = [];
          if (addedItems.length > 0)
            details.push(`added: ${addedItems.join(", ")}`);
          if (removedItems.length > 0)
            details.push(`removed: ${removedItems.join(", ")}`);
          if (reordered) details.push("reordered");
          console.log(
            `Collection log page changed: ${pageName} (ID: ${pageId}) in tab ${tabName} (ID: ${tabId}) [${details.join("; ")}]`,
          );

          pagesWithChanges.push({
            tab: tabName as string,
            page: {
              ...existingPage,
              // Write the cache's ordering verbatim.
              items: expectedItems,
            },
            isNew: false,
            addedItems,
            removedItems,
            reordered,
          });
        }
      }
    }

    // Record the cache's page order so writeChanges can lay the pages out
    // correctly (new pages get inserted in the right place, not appended).
    tabPageOrder.set(tabName as string, expectedPageNames);

    // Detect pages that exist in the file but are no longer in the cache.
    // These are removed from the file so stale pages (e.g. Venators) don't
    // linger after being dropped upstream.
    if (existingTab) {
      for (const page of existingTab.pages) {
        if (!expectedPageNames.includes(page.name)) {
          console.log(
            `Collection log page removed: ${page.name} in tab ${tabName}`,
          );
          removedPages.push({ tab: tabName as string, pageName: page.name });
        }
      }
    }

    // Detect a pure reordering of existing pages: compare the current file
    // order against the cache order, restricted to pages present in both.
    // (New pages are handled separately and would also trigger a reorder.)
    if (existingTab) {
      const currentNames = existingTab.pages.map((page) => page.name);
      const currentInCache = currentNames.filter((name) =>
        expectedPageNames.includes(name),
      );
      const expectedInFile = expectedPageNames.filter((name) =>
        currentNames.includes(name),
      );
      const orderMatches =
        currentInCache.length === expectedInFile.length &&
        currentInCache.every((name, i) => name === expectedInFile[i]);

      if (!orderMatches) {
        console.log(`Collection log page order changed in tab ${tabName}`);
        reorderedTabs.push(tabName as string);
      }
    }
  }

  const hasChanges =
    pagesWithChanges.length > 0 ||
    reorderedTabs.length > 0 ||
    removedPages.length > 0 ||
    Object.keys(newItems).length > 0 ||
    changedItemNames.length > 0;

  if (!hasChanges) {
    console.log("No changes found in collection log data.");
    return;
  }

  // Build change summary
  const summary = buildChangeSummary(
    pagesWithChanges,
    reorderedTabs,
    removedPages,
    newItems,
    changedItemNames,
  );
  console.log(summary);

  if (writeMode) {
    writeChanges(
      pagesWithChanges,
      tabPageOrder,
      reorderedTabs,
      removedPages,
      newItems,
      changedItemNames,
    );

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

    if (removedPages.length > 0) {
      console.log("\n=== REMOVED PAGES ===\n");
      console.log("// Re-run with --write to delete these stale pages, or");
      console.log("// remove them manually from COLLECTION_LOG_TABS:");
      for (const { tab, pageName } of removedPages) {
        console.log(`//   - ${pageName} (tab: ${tab})`);
      }
      console.log("");
    }

    if (reorderedTabs.length > 0) {
      console.log("\n=== PAGES OUT OF ORDER ===\n");
      console.log(
        "// Re-run with --write to reorder pages to match the cache, or",
      );
      console.log("// fix the page order manually in these tabs:");
      for (const tab of reorderedTabs) {
        console.log(`//   - ${tab}: ${tabPageOrder.get(tab)?.join(", ")}`);
      }
      console.log("");
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
        console.log("// NAME CHANGES - Update these in COLLECTION_LOG_ITEMS:");
        const sortedChangedItems = changedItemNames.sort((a, b) => a.id - b.id);
        for (const { id, oldName, newName } of sortedChangedItems) {
          console.log(`  ${id}: "${newName}", // was: "${oldName}"`);
        }
        console.log("");
      }
    }
  }
}

function buildChangeSummary(
  pagesWithChanges: PageChange[],
  reorderedTabs: string[],
  removedPages: Array<{ tab: string; pageName: string }>,
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
    for (const {
      tab,
      page,
      addedItems,
      removedItems,
      reordered,
    } of updatedPages) {
      const details: string[] = [];
      if (addedItems.length > 0)
        details.push(
          `+${addedItems.length} item${addedItems.length > 1 ? "s" : ""}`,
        );
      if (removedItems.length > 0)
        details.push(
          `-${removedItems.length} item${removedItems.length > 1 ? "s" : ""}`,
        );
      if (reordered) details.push("reordered");
      lines.push(
        `- **${page.name}** in tab *${tab}*${details.length > 0 ? ` (${details.join(", ")})` : ""}`,
      );
    }
    lines.push("");
  }

  if (removedPages.length > 0) {
    lines.push(`### Removed Pages (${removedPages.length})\n`);
    for (const { tab, pageName } of removedPages) {
      lines.push(`- **${pageName}** in tab *${tab}*`);
    }
    lines.push("");
    lines.push(
      "> **Note:** These pages are gone from the cache and have been deleted. Their items remain in `COLLECTION_LOG_ITEMS` in case they are shared with other pages — remove any now-orphaned entries manually.\n",
    );
  }

  // Tabs whose pages were out of order (and not already listed above because
  // of a new/updated page) — the write reorders them to match the cache.
  const reorderedOnly = reorderedTabs.filter(
    (tab) => !pagesWithChanges.some((p) => p.tab === tab),
  );
  if (reorderedOnly.length > 0) {
    lines.push(`### Reordered Pages (${reorderedOnly.length})\n`);
    for (const tab of reorderedOnly) {
      lines.push(`- Pages reordered in tab *${tab}*`);
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
  pagesWithChanges: PageChange[],
  tabPageOrder: Map<string, string[]>,
  reorderedTabs: string[],
  removedPages: Array<{ tab: string; pageName: string }>,
  newItems: Record<number, string>,
  changedItemNames: Array<{ id: number; oldName: string; newName: string }>,
) {
  console.log(`\nWriting changes to ${COLLECTION_LOG_PATH}...`);

  // No tsconfig is needed: we only parse, mutate and re-save a single source
  // file's AST, which doesn't depend on compiler options. (There is no
  // tsconfig at the repo root anyway.)
  const project = new Project();
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
        console.warn(`Could not find page "${page.name}" in tab "${tabName}"`);
        continue;
      }

      const itemsProp = pageElement.getPropertyOrThrow("items");
      if (!itemsProp.isKind(SyntaxKind.PropertyAssignment)) continue;
      const itemsStr = `[${page.items.join(", ")}]`;
      itemsProp.setInitializer(itemsStr);
    }
  }

  // --- Remove pages no longer in the cache ---
  for (const { tab: tabName, pageName } of removedPages) {
    const tabElement = tabsArray.getElements().find((el) => {
      if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) return false;
      const nameProp = el.getProperty("name");
      if (!nameProp || !nameProp.isKind(SyntaxKind.PropertyAssignment))
        return false;
      return nameProp.getInitializer()?.getText() === `"${tabName}"`;
    });

    if (!tabElement || !tabElement.isKind(SyntaxKind.ObjectLiteralExpression)) {
      console.warn(`Could not find tab "${tabName}" to remove page from`);
      continue;
    }

    const pagesProp = tabElement.getPropertyOrThrow("pages");
    if (!pagesProp.isKind(SyntaxKind.PropertyAssignment)) continue;
    const pagesArray = pagesProp.getInitializerIfKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );

    const pageIndex = pagesArray.getElements().findIndex((el) => {
      if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) return false;
      const nameProp = el.getProperty("name");
      if (!nameProp || !nameProp.isKind(SyntaxKind.PropertyAssignment))
        return false;
      return nameProp.getInitializer()?.getText() === `"${pageName}"`;
    });

    if (pageIndex === -1) {
      console.warn(`Could not find page "${pageName}" in tab "${tabName}"`);
      continue;
    }

    pagesArray.removeElement(pageIndex);
  }

  // --- Reorder pages to match the cache's order ---
  // Reorder any tab that drifted out of order or just had a new page appended,
  // so new pages land in their correct position instead of at the end.
  const tabsWithNewPages = pagesWithChanges
    .filter((p) => p.isNew)
    .map((p) => p.tab);
  const tabsToReorder = [...new Set([...reorderedTabs, ...tabsWithNewPages])];

  for (const tabName of tabsToReorder) {
    const desiredOrder = tabPageOrder.get(tabName);
    if (!desiredOrder) continue;

    const tabElement = tabsArray.getElements().find((el) => {
      if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) return false;
      const nameProp = el.getProperty("name");
      if (!nameProp || !nameProp.isKind(SyntaxKind.PropertyAssignment))
        return false;
      return nameProp.getInitializer()?.getText() === `"${tabName}"`;
    });

    if (!tabElement || !tabElement.isKind(SyntaxKind.ObjectLiteralExpression)) {
      console.warn(`Could not find tab "${tabName}" to reorder`);
      continue;
    }

    const pagesProp = tabElement.getPropertyOrThrow("pages");
    if (!pagesProp.isKind(SyntaxKind.PropertyAssignment)) continue;
    const pagesArray = pagesProp.getInitializerIfKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );

    // Capture each page element's source text keyed by its name.
    const elements = pagesArray.getElements();
    const textByName = new Map<string, string>();
    const unknownTexts: string[] = []; // pages not in the cache order
    for (const el of elements) {
      let name: string | undefined;
      if (el.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const nameProp = el.getProperty("name");
        if (nameProp && nameProp.isKind(SyntaxKind.PropertyAssignment)) {
          name = nameProp.getInitializer()?.getText().replace(/^"|"$/g, "");
        }
      }
      if (name) textByName.set(name, el.getText());
      else unknownTexts.push(el.getText());
    }

    // Rebuild the array: cache order first, then any pages not in the cache
    // (kept at the end, preserving their relative order).
    const orderedTexts: string[] = [];
    for (const name of desiredOrder) {
      const text = textByName.get(name);
      if (text) {
        orderedTexts.push(text);
        textByName.delete(name);
      }
    }
    orderedTexts.push(...textByName.values(), ...unknownTexts);

    // Skip the rewrite if the order is already correct.
    const alreadyOrdered =
      orderedTexts.length === elements.length &&
      orderedTexts.every((text, i) => text === elements[i].getText());
    if (alreadyOrdered) continue;

    for (let i = pagesArray.getElements().length - 1; i >= 0; i--) {
      pagesArray.removeElement(i);
    }
    for (const text of orderedTexts) {
      pagesArray.addElement(text);
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
