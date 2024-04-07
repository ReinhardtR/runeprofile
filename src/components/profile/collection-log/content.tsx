"use client";

import { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import * as ToggleGroup from "@radix-ui/react-toggle-group";

import { isValidTab, TabName } from "~/lib/constants/collection-log";
import {
  CollectionLogKillCount,
  type CollectionLogItem as CollectionLogItemType,
} from "~/lib/domain/profile-data-types";
import { cn } from "~/lib/utils/cn";
import { numberWithDelimiter } from "~/lib/utils/numbers";
import { getDateString } from "~/lib/utils/time";
import { useSearchParamsUtils } from "~/lib/utils/use-search-params-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Card } from "~/components/card";
import { ImageWithFallback } from "~/components/misc/image-with-fallback";
import ItemIcons from "~/assets/item-icons.json";

type CollectionLogPageFormatted = {
  displayName: string;
  kcs: CollectionLogKillCount[];
  items: CollectionLogItemType[];
};

type CollectionLogTabFormatted = {
  displayName: string;
  pages: {
    [pageName: string]: CollectionLogPageFormatted;
  };
};

export type CollectionLogFormatted = {
  uniqueItemsObtained: number;
  uniqueItemsTotal: number;
  tabs: {
    [tabName in TabName]: CollectionLogTabFormatted;
  };
};

export type CollectionLogContentProps = {
  username: string;
  collectionLog: CollectionLogFormatted;
};

const TAB_PARAM_KEY = "tab";
const PAGE_PARAM_KEY = "page";

export const CollectionLogContent: React.FC<CollectionLogContentProps> = ({
  username,
  collectionLog,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createPathString } = useSearchParamsUtils();

  let tabName = searchParams.get(TAB_PARAM_KEY)?.toLowerCase() as TabName;
  if (!tabName || !isValidTab(tabName)) {
    tabName = "bosses";
  }

  const pageNames = Object.keys(collectionLog.tabs[tabName].pages);
  let pageName = searchParams.get(PAGE_PARAM_KEY)?.toLowerCase();
  if (!pageName || !pageNames.includes(pageName)) {
    pageName = pageNames[0]!;
  }

  const tab = collectionLog.tabs[tabName];
  const page = tab.pages[pageName]!;

  console.log("tab: ", tabName);
  console.log("page: ", pageName);

  if (!page) return null;

  const pageItemsObtained = page.items.filter(
    (item) => !!item.obtainedAt
  ).length;

  const setTab = (newTab?: string) => {
    if (!newTab || !isValidTab(newTab)) return;
    const firstPageName = Object.keys(collectionLog.tabs[newTab].pages)[0]!;
    router.replace(
      createPathString({
        [TAB_PARAM_KEY]: newTab,
        [PAGE_PARAM_KEY]: firstPageName,
      }),
      { scroll: false }
    );
  };

  const prefetchTab = (newTab: string) => {
    if (!isValidTab(newTab)) return;
    const firstPageName = Object.keys(collectionLog.tabs[newTab].pages)[0]!;
    router.prefetch(
      createPathString({
        [TAB_PARAM_KEY]: newTab,
        [PAGE_PARAM_KEY]: firstPageName,
      })
    );
  };

  const setPage = (newPage?: string) => {
    if (!newPage) return;
    router.replace(
      createPathString({
        [TAB_PARAM_KEY]: tabName,
        [PAGE_PARAM_KEY]: newPage,
      }),
      { scroll: false }
    );
  };

  const prefetchPage = (newPage: string) => {
    router.prefetch(
      createPathString({
        [PAGE_PARAM_KEY]: newPage,
      })
    );
  };

  return (
    <Card
      iconPath="/assets/icons/collection-log.png"
      className="w-[260px] sm:w-full md:w-[640px]"
    >
      <div
        className={cn(
          "absolute inset-x-0 -top-[14px] left-[140px] mx-auto w-24 font-runescape text-lg font-bold solid-text-shadow",
          {
            "text-osrs-green":
              collectionLog.uniqueItemsObtained ===
              collectionLog.uniqueItemsTotal,
            "text-osrs-orange":
              collectionLog.uniqueItemsObtained !==
              collectionLog.uniqueItemsTotal,
            "text-osrs-red": collectionLog.uniqueItemsObtained === 0,
            "text-osrs-gray": collectionLog.uniqueItemsTotal === 0,
          }
        )}
      >
        {collectionLog.uniqueItemsObtained} / {collectionLog.uniqueItemsTotal}
      </div>

      <div className="flex h-full w-full flex-col px-0.5 pt-0.5 font-runescape text-osrs-orange">
        <ToggleGroup.Root
          type="single"
          defaultValue={tabName}
          onValueChange={setTab}
          className="flex md:space-x-1"
        >
          {Object.entries(collectionLog.tabs).map(
            ([currentTabName, currentTab]) => (
              <ToggleGroup.Item
                key={currentTabName}
                value={currentTabName}
                onMouseOver={() => prefetchTab(currentTabName)}
                className={cn(
                  "box-border max-w-[25%] flex-1 truncate rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-center text-xl outline-0 solid-text-shadow",
                  tabName === currentTabName && "bg-osrs-tab-selected"
                )}
              >
                {currentTab.displayName}
              </ToggleGroup.Item>
            )
          )}
        </ToggleGroup.Root>
        <div className="h-full overflow-y-clip">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="h-full">
              <ToggleGroup.Root
                type="single"
                value={pageName}
                onValueChange={setPage}
                className="flex min-h-[100px] w-full flex-col overflow-y-scroll border-t-2 border-osrs-border sm:h-full sm:w-[260px]"
              >
                {Object.entries(tab.pages).map(
                  ([currentPageName, currentPage]) => {
                    const isCompleted = currentPage.items.every(
                      (item) => !!item.obtainedAt
                    );
                    const isEmpty = currentPage.items.length === 0;
                    const isNothingObtained = currentPage.items.every(
                      (item) => !item.obtainedAt
                    );
                    return (
                      <ToggleGroup.Item
                        key={currentPageName}
                        value={currentPageName}
                        onMouseOver={() => prefetchPage(currentPageName)}
                        className={cn(
                          "px-1 text-start text-xl solid-text-shadow hover:bg-white hover:bg-opacity-[0.20]",
                          {
                            "text-osrs-green": isCompleted,
                            "text-osrs-red": isNothingObtained,
                            "text-osrs-gray": isEmpty,
                          },
                          pageName === currentPageName
                            ? "bg-white bg-opacity-[0.15]"
                            : "odd:bg-white odd:bg-opacity-[0.05]"
                        )}
                      >
                        {currentPage.displayName}
                      </ToggleGroup.Item>
                    );
                  }
                )}
              </ToggleGroup.Root>
            </div>

            <div className="flex-1">
              <div className="flex h-full flex-col">
                <div className="relative w-full border-2 border-osrs-border p-1">
                  <p className="text-2xl font-bold leading-none solid-text-shadow">
                    {page.displayName}
                  </p>
                  <p className="text-lg leading-none solid-text-shadow">
                    Obtained:{" "}
                    <span
                      className={cn({
                        "text-osrs-green":
                          pageItemsObtained === page.items.length,
                        "text-osrs-yellow":
                          pageItemsObtained !== page.items.length,
                        "text-osrs-red": pageItemsObtained === 0,
                        "text-osrs-gray": page.items.length === 0,
                      })}
                    >
                      {pageItemsObtained}/{page.items.length}
                    </span>
                  </p>
                  {page.kcs.map((kc) => (
                    <p
                      key={kc.label}
                      className="text-lg leading-none solid-text-shadow"
                    >
                      {kc.label}:{" "}
                      <span
                        className={cn(
                          kc.count === -1 ? "text-osrs-gray" : "text-osrs-white"
                        )}
                      >
                        {kc.count === -1 ? "?" : numberWithDelimiter(kc.count)}
                      </span>
                    </p>
                  ))}
                </div>
                <div className="flex h-[100px] flex-wrap content-start gap-1 overflow-y-scroll p-1 sm:h-full">
                  {page.items.map((item) => (
                    <CollectionLogItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

type CollectionLogItemProps = {
  item: CollectionLogItemType;
};

const CollectionLogItem: React.FC<CollectionLogItemProps> = ({ item }) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="group flex-shrink">
          <div className="relative">
            {item.quantity > 1 && (
              <p className="absolute top-[-5px] z-20 text-osrs-yellow solid-text-shadow">
                {item.quantity}
              </p>
            )}
            <ImageWithFallback
              // @ts-expect-error
              src={`data:image/png;base64,${ItemIcons[item.id]}`}
              alt={item.name}
              className={cn(
                "z-10 brightness-[.70] drop-shadow-2xl",
                !item.quantity && "opacity-30"
              )}
              width={50}
              height={50}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {item.obtainedAt ? (
          <>
            <p className="text-lg font-bold text-osrs-green">{item.name}</p>
            <p className="text-base text-osrs-gray">
              {getDateString(item.obtainedAt.timestamp)}
            </p>
            <div className="flex flex-col text-lg">
              {item.obtainedAt.killCounts.map((killCount) => (
                <p key={killCount.label}>
                  <span className="text-osrs-orange">{killCount.label}: </span>
                  <span className="text-osrs-white">
                    {numberWithDelimiter(killCount.count)}
                  </span>
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className="text-lg font-bold text-osrs-red">{item.name}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
