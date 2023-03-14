import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/components/client-wrappers/tab";
import clsx from "clsx";
import { Fragment } from "react";
import { Card } from "../../Card";
import Image from "next/image";
import itemIcons from "~/assets/item-icons.json";
import { Tooltip } from "../../Misc/Tooltip";
import { format } from "date-fns";
import { useRouter } from "next/router";

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
  isCompleted: boolean;
};

type TabType = {
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
};

export function CollectionLog({ username, collectionLog }: CollectionLogProps) {
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

      <TabGroup
        as="div"
        className="flex h-full w-full flex-col px-0.5 pt-0.5 font-runescape text-osrs-orange"
      >
        <TabList className="flex md:space-x-1">
          {collectionLog.tabs.map((tab) => (
            <Tab as={Fragment} key={tab.name}>
              {({ selected }) => (
                <button
                  className={clsx(
                    "text-shadow box-border flex-1 max-w-[25%] rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-xl outline-0 truncate",
                    selected && "bg-osrs-tab-selected"
                  )}
                >
                  {tab.name}
                </button>
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels className="h-full overflow-y-clip">
          {collectionLog.tabs.map((tab) => (
            <CollectionLogTabPanel
              key={tab.name}
              tab={tab}
              username={username}
            />
          ))}
        </TabPanels>
      </TabGroup>
    </Card>
  );
}

type CollectionLogTabPanelProps = {
  tab: TabType;
  username: string;
};

const CollectionLogTabPanel: React.FC<CollectionLogTabPanelProps> = ({
  tab,
  username,
}) => {
  return (
    <TabPanel className="h-full">
      <TabGroup as="div" vertical className="flex h-full flex-col sm:flex-row">
        <TabList className="flex w-full min-h-[100px] sm:h-full sm:w-[260px] flex-col overflow-y-scroll border-t-2 border-osrs-border">
          {tab.entries.map((entry) => (
            <Tab as={Fragment} key={entry.name}>
              {({ selected }) => (
                <button
                  className={clsx(
                    "text-shadow px-1 text-start text-xl hover:bg-white hover:bg-opacity-[0.20]",
                    selected && "bg-white bg-opacity-[0.15]",
                    !selected && "odd:bg-white odd:bg-opacity-[0.05]",
                    entry.isCompleted && "text-osrs-green"
                  )}
                >
                  {entry.name}
                </button>
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels className="flex-1">
          {tab.entries.map((entry) => (
            <TabPanel key={entry.name} className="flex h-full flex-col">
              {({ selected }) => (
                // <CollectionLogEntryPanel
                //   username={username}
                //   tabName={tab.name}
                //   entryName={entry.name}
                //   isSelected={selected}
                // />
                <div>Items</div>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </TabPanel>
  );
};

type CollectionLogEntryPanelProps = {
  username: string;
  tabName: string;
  entryName: string;
  isSelected: boolean;
};

const CollectionLogEntryPanel: React.FC<CollectionLogEntryPanelProps> = ({
  username,
  tabName,
  entryName,
  isSelected,
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center w-full border-t-2 border-osrs-border p-1 relative">
        <div className="text-shadow text-xl text-osrs-yellow font-runescape">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex justify-center items-center w-full border-t-2 border-osrs-border p-1 relative">
        <div className="text-shadow text-xl text-osrs-yellow font-runescape">
          Error: {error.message}
        </div>
      </div>
    );
  }

  const { entry } = data!;

  const obtainedItemsCount = entry.items.filter(
    (item) => item.quantity > 0
  ).length;

  const totalItemsCount = entry.items.length;

  return (
    <>
      <div className="w-full border-2 border-osrs-border p-1 relative">
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
      <div className="flex h-[100px] sm:h-full flex-wrap content-start gap-1 overflow-y-scroll p-1">
        {entry.items.map((item) => (
          <CollectionLogItem key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

type CollectionLogItemProps = {
  item: ItemType;
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
              <div className="flex flex-col">
                {item.obtainedAt.killCounts.map((killCount) => (
                  <p key={killCount.name}>
                    <span className="text-osrs-orange">{killCount.name}: </span>
                    <span className="text-light-gray">{killCount.count}</span>
                  </p>
                ))}
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <p className="text-osrs-red font-bold text-lg">{item.name}</p>
            </Fragment>
          )}
        </Fragment>
      }
      placement="bottom"
    >
      <div className="flex-shrink group">
        <div className="relative">
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
            width={50}
            height={50}
          />
        </div>
      </div>
    </Tooltip>
  );
};
