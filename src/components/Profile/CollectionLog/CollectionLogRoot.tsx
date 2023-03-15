"use client";

import { clsx } from "clsx";
import { Card } from "~/components/Card";
import { CollectionLogEntry } from "~/components/Profile/CollectionLog/CollectionLogEntry";
import { CollectionLogEntryList } from "~/components/Profile/CollectionLog/CollectionLogEntryList";
import Link from "next/link";
import {
  ReadonlyURLSearchParams,
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";
import React from "react";

export type EntryType = {
  name: string;
  isCompleted: boolean;
};

export type TabType = {
  name: string;
  entries: EntryType[];
};

export function CollectionLog(props: {
  username: string;
  collectionLog?: {
    uniqueItemsObtained: number;
    uniqueItemsTotal: number;
    tabs: TabType[];
  };
}) {
  const { username, collectionLog } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams() as ReadonlyURLSearchParams;

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

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

  // Selected Tab
  const selectedTabName =
    searchParams.get("clog-tab") || collectionLog.tabs[0].name;

  const selectedTab =
    collectionLog.tabs.find((tab) => tab.name === selectedTabName) ||
    collectionLog.tabs[0];

  // Selected entry
  const selectedEntryName =
    searchParams.get("clog-entry") || selectedTab.entries[0].name;

  const selectedEntry =
    selectedTab?.entries.find((entry) => entry.name === selectedEntryName) ||
    selectedTab?.entries[0];

  const logIsCompleted =
    collectionLog.uniqueItemsObtained === collectionLog.uniqueItemsTotal;

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
            <button
              onClick={() => {
                router.push(
                  pathname + "?" + createQueryString("clog-tab", tab.name)
                );
              }}
              key={tab.name}
              className={clsx(
                "text-shadow text-center box-border flex-1 max-w-[25%] rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0 truncate",
                tab.name === selectedTabName && "bg-osrs-tab-selected"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="h-full overflow-y-clip">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="h-full">
              <CollectionLogEntryList
                username={username}
                entries={selectedTab.entries}
                selectedTabName={selectedTab.name}
                selectedEntryName={selectedEntry.name}
              />
            </div>

            <div className="flex-1">
              <div className="flex h-full flex-col">
                <CollectionLogEntry
                  username={username}
                  tabName={selectedTab.name}
                  entryName={selectedEntry.name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
