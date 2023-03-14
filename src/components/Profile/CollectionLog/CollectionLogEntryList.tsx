import { clsx } from "clsx";
import Link from "next/link";
import { EntryType } from "~/components/Profile/CollectionLog/CollectionLogRoot";

type CollectionLogEntryListProps = {
  username: string;
  selectedTabName: string;
  selectedEntryName: string;
  entries: EntryType[];
};

export function CollectionLogEntryList({
  username,
  selectedTabName,
  selectedEntryName,
  entries,
}: CollectionLogEntryListProps) {
  return (
    <div className="flex w-full min-h-[100px] sm:h-full sm:w-[260px] flex-col overflow-y-scroll border-t-2 border-osrs-border">
      {entries.map((entry) => (
        <Link
          key={entry.name}
          href={`/${username}?clog-tab=${selectedTabName}&clog-entry=${entry.name}`}
          className={clsx(
            "text-shadow px-1 text-start text-xl hover:bg-white hover:bg-opacity-[0.20]",
            entry.isCompleted && "text-osrs-green",
            entry.name === selectedEntryName
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
