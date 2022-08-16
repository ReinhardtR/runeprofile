import { Tab } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";
import { Card } from "../Card";
import Image from "next/future/image";
import itemIcons from "@/assets/item-icons.json";
import { $infer } from "@/edgeql";
import { accountQuery } from "@/pages/u/[username]";

type CollectionLogProps = {
  username: string;
  collectionLog: NonNullable<$infer<typeof accountQuery>>["collection_log"];
};

export const CollectionLog: React.FC<CollectionLogProps> = ({
  username,
  collectionLog,
}) => {
  if (!collectionLog) {
    return (
      <Card>
        <div className="flex flex-col justify-center items-center space-y-1">
          <p className="text-shadow font-runescape text-4xl text-osrs-yellow">
            <span className="font-bold">{username}</span> haven't shared their
            Collection Log yet.
          </p>
          <p>Here is how to share your Collection Log: "LINK"</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-[640px]">
      <Tab.Group
        as="div"
        className="flex h-full w-full flex-col px-0.5 pt-1 font-runescape text-osrs-orange"
      >
        <Tab.List className="flex space-x-1">
          {Object.keys(collectionLog.tabs).map((tabName) => (
            <CollectionLogTab key={tabName} name={tabName} />
          ))}
        </Tab.List>
        <Tab.Panels className="h-full overflow-y-clip">
          {Object.entries(collectionLog.tabs).map(([tabName, tab]) => (
            <CollectionLogTabPanel key={tabName} tab={tab} />
          ))}
        </Tab.Panels>
      </Tab.Group>
    </Card>
  );
};

type CollectionLogTabProps = {
  name: string;
};

const CollectionLogTab: React.FC<CollectionLogTabProps> = ({ name }) => {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button
          className={clsx(
            "text-shadow box-border flex-1 rounded-t-md border border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0",
            selected && "bg-osrs-tab-selected"
          )}
        >
          {name}
        </button>
      )}
    </Tab>
  );
};

type CollectionLogTabPanelProps = {
  tab: NonNullable<CollectionLogProps["collectionLog"]>["tabs"][number];
};

const CollectionLogTabPanel: React.FC<CollectionLogTabPanelProps> = ({
  tab,
}) => {
  return (
    <Tab.Panel className="h-full">
      <Tab.Group as="div" vertical className="flex h-full">
        <Tab.List className="flex w-[260px] flex-col overflow-y-scroll">
          {tab.entries.map((entry) => {
            const entryIsCompleted = entry.items.every(
              (item) => item.quantity > 0
            );

            return (
              <CollectionLogEntry
                key={entry.name}
                name={entry.name}
                isCompleted={entryIsCompleted}
              />
            );
          })}
        </Tab.List>
        <Tab.Panels className="flex-1">
          {tab.entries.map((entry) => (
            <CollectionLogEntryPanel key={entry.name} entry={entry} />
          ))}
        </Tab.Panels>
      </Tab.Group>
    </Tab.Panel>
  );
};

type CollectionLogEntryProps = {
  name: string;
  isCompleted: boolean;
};

const CollectionLogEntry: React.FC<CollectionLogEntryProps> = ({
  name,
  isCompleted,
}) => {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button
          className={clsx(
            "text-shadow px-1 text-start text-xl hover:bg-white hover:bg-opacity-[0.20]",
            selected && "bg-white bg-opacity-[0.15]",
            !selected && "odd:bg-white odd:bg-opacity-[0.05]",
            isCompleted && "text-osrs-green"
          )}
        >
          {name}
        </button>
      )}
    </Tab>
  );
};

type CollectionLogEntryPanelProps = {
  entry: CollectionLogTabPanelProps["tab"]["entries"][number];
};

const CollectionLogEntryPanel: React.FC<CollectionLogEntryPanelProps> = ({
  entry,
}) => {
  const obtainedItemsCount = entry.items.filter(
    (item) => item.quantity > 0
  ).length;
  const totalItemsCount = entry.items.length;

  return (
    <Tab.Panel className="flex h-full flex-col">
      <div className="w-full border-2 border-osrs-border p-1">
        <p className="text-shadow text-2xl font-bold leading-none">
          {entry.name}
        </p>
        <p className="text-shadow text-lg leading-none">
          Obtained:{" "}
          <span
            className={clsx(
              obtainedItemsCount == totalItemsCount
                ? "text-osrs-green"
                : "text-osrs-yellow"
            )}
          >
            {obtainedItemsCount}/{totalItemsCount}
          </span>
        </p>
        {entry.kill_counts?.map((killCount) => (
          <p key={killCount.name} className="text-shadow text-lg leading-none">
            {killCount.name}:{" "}
            <span className="text-white">{killCount.count}</span>
          </p>
        ))}
      </div>
      <div className="flex h-full flex-wrap content-start gap-1 overflow-y-scroll p-1">
        {entry.items.map((item) => (
          <CollectionLogItem key={item.item_id} item={item} />
        ))}
      </div>
    </Tab.Panel>
  );
};

type CollectionLogItemProps = {
  item: CollectionLogEntryPanelProps["entry"]["items"][number];
};

const CollectionLogItem: React.FC<CollectionLogItemProps> = ({ item }) => {
  return (
    <div className="relative flex-shrink">
      {item.quantity > 1 && (
        <p className="text-shadow absolute top-[-5px] z-20 text-osrs-yellow">
          {item.quantity}
        </p>
      )}
      <div className="relative w-[50px] aspect-[36/32] z-10">
        <Image
          // @ts-ignore
          src={`data:image/png;base64,${itemIcons[item.id]}`}
          alt={item.name}
          className={clsx(
            "brightness-[.60] drop-shadow-2xl",
            !item.quantity && "opacity-30"
          )}
          fill
        />
      </div>
    </div>
  );
};
