import { Tab } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";
import { Card } from "../Card";
import Image from "next/future/image";
import itemIcons from "@/assets/item-icons.json";
import { Tooltip } from "../Misc/Tooltip";
import { format } from "date-fns";

type KillCountType = {
  name: string;
  count: number;
};

type ItemType = {
  id: number;
  name: string;
  quantity: number;
  obtainedAt: {
    date: Date;
    killCounts: KillCountType[];
  } | null;
};

type EntryType = {
  name: string;
  killCounts: KillCountType[];
  items: ItemType[];
};

type TabType = {
  name: string;
  entries: EntryType[];
};

type CollectionLogProps = {
  username: string;
  collectionLog: {
    tabs: TabType[];
  };
};

export const CollectionLog: React.FC<CollectionLogProps> = ({
  username,
  collectionLog,
}) => {
  if (!collectionLog) {
    return (
      <Card>
        <div className="flex flex-col justify-center items-center space-y-1">
          <div className="text-shadow font-runescape text-4xl text-osrs-yellow">
            <span className="font-bold">{username}</span>{" "}
            <span>haven&apos;t shared their Collection Log yet.</span>
          </div>
          <p>Here is how to share your Collection Log: &quot;LINK&quot;</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      iconPath="/assets/icons/collection-log.png"
      className="w-[400px] md:w-[640px]"
    >
      <Tab.Group
        as="div"
        className="flex h-full w-full flex-col px-0.5 pt-1 font-runescape text-osrs-orange"
      >
        <Tab.List className="flex space-x-1">
          {collectionLog.tabs.map(({ name }) => (
            <CollectionLogTab key={name} name={name} />
          ))}
        </Tab.List>
        <Tab.Panels className="h-full overflow-y-clip">
          {collectionLog.tabs.map((tab) => (
            <CollectionLogTabPanel key={tab.name} tab={tab} />
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
            "text-shadow box-border flex-1 max-w-[25%] rounded-t-md border border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0",
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
  tab: TabType;
};

const CollectionLogTabPanel: React.FC<CollectionLogTabPanelProps> = ({
  tab,
}) => {
  return (
    <Tab.Panel className="h-full">
      <Tab.Group as="div" vertical className="flex h-full flex-col md:flex-row">
        <Tab.List className="flex w-full min-h-[100px] md:h-full md:w-[260px] flex-col overflow-y-scroll">
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
      <div className="w-full border-2 border-osrs-border p-1 relative z-20">
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
        {entry.killCounts?.map((killCount) => (
          <p key={killCount.name} className="text-shadow text-lg leading-none">
            {killCount.name}:{" "}
            <span className="text-light-gray">{killCount.count}</span>
          </p>
        ))}
      </div>
      <div className="flex h-[100px] md:h-full flex-wrap content-start gap-1 overflow-y-scroll p-1">
        {entry.items.map((item) => (
          <CollectionLogItem key={item.id} item={item} />
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
    <Tooltip
      content={
        <Fragment>
          {item.obtainedAt ? (
            <Fragment>
              <p className="text-osrs-green font-bold text-lg">{item.name}</p>
              <p className="text-osrs-gray text-sm">
                {format(item.obtainedAt.date, "PPP")}
              </p>
              {item.obtainedAt.killCounts.map((killCount) => (
                <p key={killCount.name}>
                  {killCount.name}:{" "}
                  <span className="text-light-gray">{killCount.count}</span>
                </p>
              ))}
            </Fragment>
          ) : (
            <p className="text-osrs-red">Not obtained</p>
          )}
        </Fragment>
      }
      placement="bottom"
    >
      <div className="flex-shrink group">
        <div className="relative w-[50px] aspect-[36/32]">
          {item.quantity > 1 && (
            <p className="text-shadow absolute top-[-5px] z-20 text-osrs-yellow">
              {item.quantity}
            </p>
          )}
          <Image
            // @ts-ignore
            src={`data:image/png;base64,${itemIcons[item.id]}`}
            alt={item.name}
            className={clsx(
              "brightness-[.60] drop-shadow-2xl z-10",
              !item.quantity && "opacity-30"
            )}
            fill
          />
        </div>
      </div>
    </Tooltip>
  );
};
