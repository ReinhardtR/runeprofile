"use client";

import React from "react";
import Image from "next/image";
import { api } from "~/utils/api";
import { clsx } from "clsx";
import { format } from "date-fns";
import { Tooltip } from "~/components/Misc/Tooltip";
import itemIcons from "~/assets/item-icons.json";

type ItemType = {
  name: string;
  quantity: number;
  obtainedAt?: {
    date: Date;
    killCounts: {
      name: string;
      count: number;
    }[];
  };
};

export function CollectionLogEntryDisplay(props: {
  username: string;
  tabName: string;
  entryName: string;
}) {
  const { username, tabName, entryName } = props;

  const { data, error, isLoading } = api.entries.byName.useQuery(
    {
      username,
      tabName,
      entryName,
    },
    {
      staleTime: Infinity,
    }
  );

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
}

type CollectionLogItemProps = {
  item: ItemType;
};

const CollectionLogItem: React.FC<CollectionLogItemProps> = ({ item }) => {
  console.log(item.name, item);
  return (
    <Tooltip
      content={
        <React.Fragment>
          {item.obtainedAt ? (
            <React.Fragment>
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
            </React.Fragment>
          ) : (
            <React.Fragment>
              <p className="text-osrs-red font-bold text-lg">{item.name}</p>
            </React.Fragment>
          )}
        </React.Fragment>
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
