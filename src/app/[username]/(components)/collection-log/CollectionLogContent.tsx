"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "~/components/Card";
import { ImageWithFallback } from "~/components/misc/image-with-fallback";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/new-tooltip";
import { TabName, isValidTab } from "~/lib/constants/collection-log";
import {
  type CollectionLogItem as CollectionLogItemType,
  CollectionLogKillCount,
} from "~/lib/domain/profile-data-types";
import { cn } from "~/lib/utils/cn";
import { numberWithDelimiter } from "~/lib/utils/numbers";
import { useSearchParamsUtils } from "~/lib/utils/use-search-params-utils";
import ItemIcons from "~/assets/item-icons.json";
import { Route } from "next";

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
      createPathString({ [PAGE_PARAM_KEY]: newPage }), //
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
          "absolute mx-auto inset-x-0 -top-[14px] font-runescape text-lg font-bold solid-text-shadow w-24 left-[140px]",
          collectionLog.uniqueItemsObtained === collectionLog.uniqueItemsTotal
            ? "text-osrs-green"
            : "text-osrs-orange"
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
                  "solid-text-shadow text-center box-border flex-1 max-w-[25%] rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0 truncate",
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
                className="flex w-full min-h-[100px] sm:h-full sm:w-[260px] flex-col overflow-y-scroll border-t-2 border-osrs-border"
              >
                {Object.entries(tab.pages).map(
                  ([currentPageName, currentPage]) => {
                    const isCompleted = currentPage.items.every(
                      (item) => !!item.obtainedAt
                    );
                    return (
                      <ToggleGroup.Item
                        key={currentPageName}
                        value={currentPageName}
                        onMouseOver={() => prefetchPage(currentPageName)}
                        className={cn(
                          "solid-text-shadow px-1 text-start text-xl hover:bg-white hover:bg-opacity-[0.20]",
                          isCompleted && "text-osrs-green",
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
                <div className="w-full border-2 border-osrs-border p-1 relative">
                  <p className="solid-text-shadow text-2xl font-bold leading-none">
                    {page.displayName}
                  </p>
                  <p className="solid-text-shadow text-lg leading-none">
                    Obtained:{" "}
                    <span
                      className={cn(
                        pageItemsObtained === page.items.length
                          ? "text-osrs-green"
                          : "text-osrs-yellow"
                      )}
                    >
                      {pageItemsObtained}/{page.items.length}
                    </span>
                  </p>
                  {page.kcs.map((kc) => (
                    <p
                      key={kc.label}
                      className="solid-text-shadow text-lg leading-none"
                    >
                      {kc.label}:{" "}
                      <span className="text-light-gray">
                        {kc.count === -1 ? "?" : numberWithDelimiter(kc.count)}
                      </span>
                    </p>
                  ))}
                </div>
                <div className="flex h-[100px] sm:h-full flex-wrap content-start gap-1 overflow-y-scroll p-1">
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
        <div className="flex-shrink group">
          <div className="relative">
            {item.quantity > 1 && (
              <p className="solid-text-shadow absolute top-[-5px] z-20 text-osrs-yellow">
                {item.quantity}
              </p>
            )}
            <ImageWithFallback
              // @ts-expect-error
              src={`data:image/png;base64,${ItemIcons[item.id]}`}
              alt={item.name}
              className={cn(
                "brightness-[.70] drop-shadow-2xl z-10",
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
            <p className="text-osrs-green font-bold text-lg">{item.name}</p>
            <p className="text-osrs-gray text-base">
              {item.obtainedAt.timestamp.toLocaleDateString()}
            </p>
            <div className="flex flex-col text-lg">
              {item.obtainedAt.killCounts.map((killCount) => (
                <p key={killCount.label}>
                  <span className="text-osrs-orange">{killCount.label}: </span>
                  <span className="text-light-gray">
                    {numberWithDelimiter(killCount.count)}
                  </span>
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className="text-osrs-red font-bold text-lg">{item.name}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
