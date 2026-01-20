import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

import { Profile } from "~/core/api";
import ITEM_ICONS from "~/core/assets/item-icons.json";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import { Card } from "~/features/profile/components/card";
import { GameIcon } from "~/shared/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { formatDate } from "~/shared/utils";

export function RecentCollections({
  events,
}: {
  events: Profile["recentItems"];
}) {
  return (
    <Card className="xl:w-full xl:h-24 px-4 grid grid-cols-3 xl:grid-cols-10 items-start xl:items-center py-6 xl:py-0">
      <p className="font-runescape text-osrs-orange text-lg absolute -top-4 text-center inset-x-0 font-bold solid-text-shadow">
        Latest Collections
      </p>
      {events.map((event, idx) => {
        const itemIcon =
          ITEM_ICONS[event.data.itemId as unknown as keyof typeof ITEM_ICONS];

        const itemName = COLLECTION_LOG_ITEMS[event.data.itemId] ?? "Unknown";
        const wikiUrlName = itemName.replaceAll(" ", "_");

        return (
          <Tooltip key={idx}>
            <TooltipTrigger>
              <a
                href={`https://oldschool.runescape.wiki/w/${wikiUrlName}`}
                target="_blank"
                rel="noreferrer"
              >
                {itemIcon ? (
                  <GameIcon
                    src={itemIcon}
                    alt={itemName}
                    size={54}
                    className="z-10 drop-shadow-2xl mx-auto"
                  />
                ) : (
                  <img
                    src={QuestionMarkImage}
                    alt={itemName}
                    className="z-10 drop-shadow-2xl size-[54px] object-contain mx-auto"
                  />
                )}
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-sm">{itemName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(event.createdAt)}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {events.length === 0 && (
        <div className="flex flex-row items-center justify-center col-span-3 xl:col-span-10 my-auto">
          <p className="text-xl font-runescape text-osrs-gray">
            None tracked yet
          </p>
        </div>
      )}
    </Card>
  );
}
