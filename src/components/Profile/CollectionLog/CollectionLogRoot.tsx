import React, { Suspense } from "react";
import { clsx } from "clsx";
import { Card } from "~/components/Card";
import {
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from "~/components/client-wrappers/tab";
import { CollectionLogEntry } from "~/components/Profile/CollectionLog/CollectionLogEntry";
import { CollectionLogEntryList } from "~/components/Profile/CollectionLog/CollectionLogEntryList";
import Link from "next/link";

export type EntryType = {
  name: string;
  isCompleted: boolean;
};

export type TabType = {
  name: string;
  entries: EntryType[];
};

type CollectionLogProps = {
  username: string;
  collectionLog?: {
    uniqueItemsObtained: number;
    uniqueItemsTotal: number;
    tabs: TabType[];
  };
  selectedTab?: string;
  selectedEntry?: string;
};

export function CollectionLog({
  username,
  collectionLog,
  selectedTab,
  selectedEntry,
}: CollectionLogProps) {
  if (!collectionLog || collectionLog.tabs.length === 0) {
    return (
      <Card
        iconPath="/assets/icons/collection-log.png"
        className="w-[260px] sm:w-full md:w-[640px]"
      >
        <div className="flex flex-col justify-center items-center space-y-1 h-full text-center">
          <div className="text-shadow font-runescape text-2xl text-osrs-orange">
            <span className="font-bold">{username}</span>{" "}
            <span>haven&apos;t shared their Collection Log yet.</span>
          </div>

          <a
            className="font-runescape text-lg text-osrs-yellow hover:text-osrs-orange transition-all"
            href="https://github.com/ReinhardtR/runeprofile-plugin#updating-the-collection-log"
            target="_blank"
            rel="noreferrer"
          >
            Link to Guide
          </a>
        </div>
      </Card>
    );
  }

  const logIsCompleted =
    collectionLog.uniqueItemsObtained === collectionLog.uniqueItemsTotal;

  const currentTab =
    selectedTab && collectionLog.tabs.find((tab) => tab.name === selectedTab)
      ? collectionLog.tabs.find((tab) => tab.name === selectedTab)
      : collectionLog.tabs[0];

  return (
    <Card
      iconPath="/assets/icons/collection-log.png"
      className="w-[260px] sm:w-full md:w-[640px]"
    >
      <div
        className={clsx(
          "absolute mx-auto inset-x-0 -top-[14px] font-runescape text-lg font-bold text-shadow w-24 left-[140px]",
          logIsCompleted ? "text-osrs-green" : "text-osrs-orange"
        )}
      >
        {collectionLog.uniqueItemsObtained} / {collectionLog.uniqueItemsTotal}
      </div>

      <div className="flex h-full w-full flex-col px-0.5 pt-0.5 font-runescape text-osrs-orange">
        <div className="flex md:space-x-1">
          {collectionLog.tabs.map((tab) => (
            <Link
              key={tab.name}
              href={`/${username}?clog-tab=${tab.name}`}
              className={clsx(
                "text-shadow text-center box-border flex-1 max-w-[25%] rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0 truncate",
                tab.name === currentTab?.name! && "bg-osrs-tab-selected"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        <div className="h-full overflow-y-clip">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="h-full">
              <CollectionLogEntryList
                username={username}
                selectedTabName={currentTab?.name!}
                selectedEntryName={selectedEntry!}
                entries={currentTab?.entries!}
              />
            </div>

            <div className="flex-1">
              <div className="flex h-full flex-col">
                {/* @ts-expect-error Async Server */}
                <CollectionLogEntry
                  username={username}
                  tabName={currentTab?.name!}
                  entryName={selectedEntry!}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
