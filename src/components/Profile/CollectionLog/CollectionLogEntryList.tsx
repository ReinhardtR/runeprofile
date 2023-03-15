"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { EntryType } from "~/components/Profile/CollectionLog/CollectionLogRoot";

export function CollectionLogEntryList(props: {
  username: string;
  selectedTabName: string;
  selectedEntryName: string;
  entries: EntryType[];
}) {
  return (
    <div className="flex w-full min-h-[100px] sm:h-full sm:w-[260px] flex-col overflow-y-scroll border-t-2 border-osrs-border">
      {props.entries.map((entry) => (
        <Link
          key={entry.name}
          href={`/${props.username}?clog-tab=${props.selectedTabName}&clog-entry=${entry.name}`}
          className={clsx(
            "text-shadow px-1 text-start text-xl hover:bg-white hover:bg-opacity-[0.20]",
            entry.isCompleted && "text-osrs-green",
            entry.name === props.selectedEntryName
              ? "bg-white bg-opacity-[0.15]"
              : "odd:bg-white odd:bg-opacity-[0.05]"
          )}
        >
          {entry.name}
        </Link>
      ))}
    </div>
  );
}
