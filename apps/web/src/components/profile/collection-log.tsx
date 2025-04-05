import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Link } from "@tanstack/react-router";

import {
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_TABS,
} from "@runeprofile/runescape";

import CollectionLogIcon from "~/assets/icons/collection-log.png";
import ITEM_ICONS from "~/assets/item-icons.json";
import QuestionMarkImage from "~/assets/question-mark.png";
import { Card } from "~/components/card";
import RuneScapeScrollContainer from "~/components/profile/runescape-scroll-container";
import { Profile } from "~/lib/api";
import { cn } from "~/lib/utils";

export function CollectionLog({
  page,
  data,
}: {
  page: string;
  data: Profile["items"];
}) {
  let currentTab = COLLECTION_LOG_TABS[0];
  let currentPage = currentTab.pages[0];

  for (const tab of COLLECTION_LOG_TABS) {
    const _currentPage = tab.pages.find(
      (p) => p.name.toLowerCase() === page.toLowerCase(),
    );
    if (_currentPage) {
      currentTab = tab;
      currentPage = _currentPage;
      break;
    }
  }

  const items: { id: number; name: string; quantity: number }[] = [];
  for (const item of COLLECTION_LOG_ITEMS) {
    const itemData = data.find((i) => i.id === item.id);
    items.push({
      id: item.id,
      name: item.name,
      quantity: itemData?.quantity || 0,
    });
  }

  const currentPageObtainedCount = currentPage.items.filter(
    (itemId) => !!items.find((i) => i.id === itemId)?.quantity,
  ).length;
  const obtainedCount = items.filter((item) => item.quantity > 0).length;
  const itemsCount = items.length;

  return (
    <Card icon={CollectionLogIcon} className="w-[260px] sm:w-full md:w-[640px]">
      <div
        className={cn(
          "absolute inset-x-0 -top-[14px] left-[140px] mx-auto w-24 font-runescape text-lg font-bold solid-text-shadow",
          {
            "text-osrs-green": obtainedCount === itemsCount,
            "text-osrs-orange": obtainedCount !== itemsCount,
            "text-osrs-red": obtainedCount === 0,
          },
        )}
      >
        {obtainedCount} / {itemsCount}
      </div>

      <div className="flex h-full w-full flex-col px-0.5 pt-0.5 font-runescape text-osrs-orange">
        <ToggleGroup.Root
          type="single"
          defaultValue={currentTab.name}
          className="flex md:space-x-1"
        >
          {COLLECTION_LOG_TABS.map((t) => (
            <ToggleGroup.Item
              key={t.name}
              value={t.name}
              className={cn(
                "box-border max-w-[25%] flex-1 truncate rounded-t-md border-x border-b-0 border-t-2 border-osrs-border bg-osrs-tab px-2 text-center text-xl outline-0 solid-text-shadow",
                currentTab.name === t.name && "bg-osrs-tab-selected",
              )}
              asChild
            >
              <Link
                to="."
                search={{ page: t.pages[0].name.toLowerCase() }}
                resetScroll={false}
              >
                {t.name}
              </Link>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <div className="h-full overflow-y-hidden">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="h-full">
              <ToggleGroup.Root
                type="single"
                value={page.toLowerCase()}
                className="flex min-h-[100px] w-full border-t-2 border-osrs-border sm:h-full sm:w-[260px]"
                asChild
              >
                <RuneScapeScrollContainer contentClassName="flex-col flex">
                  {currentTab.pages.map((page) => {
                    const pageObtainedCount = page.items.filter(
                      (itemId) =>
                        !!items.find((i) => i.id === itemId)?.quantity,
                    ).length;

                    const isCompleted = page.items.length === pageObtainedCount;
                    const isNothingObtained = pageObtainedCount === 0;

                    return (
                      <ToggleGroup.Item
                        key={page.name}
                        value={page.name.toLowerCase()}
                        className={cn(
                          "px-1 text-start text-xl solid-text-shadow hover:bg-white/20 cursor-pointer",
                          {
                            "text-osrs-green": isCompleted,
                            "text-osrs-red": isNothingObtained,
                          },
                          page.name === currentPage.name
                            ? "bg-white/15"
                            : "odd:bg-white/5",
                        )}
                        asChild
                      >
                        <Link
                          to="."
                          search={{ page: page.name.toLowerCase() }}
                          resetScroll={false}
                        >
                          {page.name}
                        </Link>
                      </ToggleGroup.Item>
                    );
                  })}
                </RuneScapeScrollContainer>
              </ToggleGroup.Root>
            </div>

            <div className="flex-1">
              <div className="flex h-full flex-col">
                <div className="relative w-full border-2 border-osrs-border p-1">
                  <p className="text-2xl font-bold leading-none solid-text-shadow">
                    {currentPage.name}
                  </p>
                  <p className="text-lg leading-none solid-text-shadow">
                    Obtained:{" "}
                    <span
                      className={cn({
                        "text-osrs-green":
                          currentPageObtainedCount === currentPage.items.length,
                        "text-osrs-yellow":
                          currentPageObtainedCount !== currentPage.items.length,
                        "text-osrs-red": currentPageObtainedCount === 0,
                      })}
                    >
                      {currentPageObtainedCount}/{currentPage.items.length}
                    </span>
                  </p>
                  {/* {page.kcs.map((kc) => (
                    <p
                      key={kc.label}
                      className="text-lg leading-none solid-text-shadow"
                    >
                      {kc.label}:{" "}
                      <span
                        className={cn(
                          kc.count === -1
                            ? "text-osrs-gray"
                            : "text-osrs-white",
                        )}
                      >
                        {kc.count === -1 ? "?" : numberWithDelimiter(kc.count)}
                      </span>
                    </p>
                  ))} */}
                </div>
                <RuneScapeScrollContainer
                  className="h-[100px] sm:h-full"
                  contentClassName="flex flex-wrap content-start gap-1 p-1"
                >
                  {currentPage.items.map((id) => {
                    const item = items.find((i) => i.id === id);
                    return item ? (
                      <CollectionLogItem
                        key={id}
                        id={item.id}
                        name={item.name}
                        quantity={item.quantity}
                      />
                    ) : null;
                  })}
                </RuneScapeScrollContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollectionLogItem({
  id,
  name,
  quantity,
}: {
  id: number;
  name: string;
  quantity: number;
}) {
  const wikiUrlName = name.replaceAll(" ", "_");

  const itemIcon = ITEM_ICONS[id as unknown as keyof typeof ITEM_ICONS];
  const iconSrc = itemIcon
    ? `data:image/png;base64,${itemIcon}`
    : QuestionMarkImage;

  return (
    <div className="relative w-[50px] h-[44px]">
      {quantity > 1 && (
        <p className="absolute top-[-5px] z-20 text-osrs-yellow solid-text-shadow">
          {quantity}
        </p>
      )}
      <a
        href={`https://oldschool.runescape.wiki/w/${wikiUrlName}`}
        target="_blank"
        rel="noreferrer"
      >
        <img
          src={iconSrc}
          alt={name}
          className={cn(
            "z-10 drop-shadow-2xl brightness-[0.85] size-[50px] object-scale-down scale-150",
            !quantity && "opacity-30",
          )}
        />
      </a>
    </div>
  );
}
