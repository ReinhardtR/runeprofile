import {
  ActivityEventType,
  COLLECTION_LOG_ITEMS,
} from "@runeprofile/runescape";

import ITEM_ICONS from "~/assets/item-icons.json";
import QuestionMarkImage from "~/assets/misc/question-mark.png";
import { Card } from "~/components/osrs/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Profile } from "~/lib/api";
import { base64ImgSrc, cn } from "~/lib/utils";

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
        const iconSrc = itemIcon ? base64ImgSrc(itemIcon) : QuestionMarkImage;

        const itemName = COLLECTION_LOG_ITEMS[event.data.itemId] ?? "Unknown";

        return (
          <Tooltip key={idx}>
            <TooltipTrigger>
              <img
                src={iconSrc}
                alt={itemName}
                className={cn(
                  "z-10 drop-shadow-2xl brightness-[0.85] size-[54px] object-contain mx-auto",
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold text-sm">{itemName}</p>
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
