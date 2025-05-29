import {
  ACHIEVEMENT_DIARY_TIER_NAMES,
  ActivityEvent,
  ActivityEventType,
  QUESTS,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import CombatAchievementTierIcons from "~/assets/combat-achievement-tier-icons.json";
import AchievementDiaryIcon from "~/assets/icons/achievement-diaries.png";
import QuestIcon from "~/assets/icons/quest.png";
import SkillIconsLarge from "~/assets/skill-icons-large.json";
import { Card } from "~/components/osrs/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Profile } from "~/lib/api";
import { base64ImgSrc } from "~/lib/utils";

type ProfileRecentActivity = Profile["recentActivities"][number];

const ActivityRenderMap = {
  [ActivityEventType.LEVEL_UP]: RenderLevelUpEvent,
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]:
    RenderAchievementDiaryTierCompletedEvent,
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]:
    RenderCombatAchievementTierCompletedEvent,
  [ActivityEventType.QUEST_COMPLETED]: RenderQuestCompletedEvent,
};

export function RecentActivities({
  events,
}: {
  events: Profile["recentActivities"];
}) {
  return (
    <Card className="xl:w-full xl:h-24 items-start xl:items-end pb-3 grid grid-cols-3 xl:grid-cols-10 px-3 py-6 xl:pt-5">
      <p className="font-runescape text-osrs-orange text-lg absolute -top-4 text-center inset-x-0 font-bold solid-text-shadow">
        Latest Activities
      </p>
      {events.map((event, idx) => {
        const Renderer = ActivityRenderMap[event.type];
        return (
          <Renderer
            key={idx}
            // @ts-expect-error event type is unknown here
            event={event}
          />
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

function RenderLevelUpEvent({
  event,
}: {
  event: Extract<
    ProfileRecentActivity,
    { type: typeof ActivityEventType.LEVEL_UP }
  >;
}) {
  const skillIcon =
    SkillIconsLarge[
      event.data.name.toLowerCase() as unknown as keyof typeof SkillIconsLarge
    ];
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex flex-col items-center justify-center col-span-1">
          <img
            src={base64ImgSrc(skillIcon)}
            alt={event.data.name}
            className="size-9 object-contain drop-shadow-solid-sm"
          />
          <p className="font-runescape text-osrs-orange solid-text-shadow">
            Lvl. {event.data.level}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold text-sm">
          Reached level{" "}
          <span className="text-secondary-foreground">{event.data.level}</span>{" "}
          in{" "}
          <span className="text-secondary-foreground">{event.data.name}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function RenderAchievementDiaryTierCompletedEvent({
  event,
}: {
  event: Extract<
    ProfileRecentActivity,
    { type: typeof ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED }
  >;
}) {
  const areaName = getAchievementDiaryAreaName(event.data.areaId) ?? "Unknown";
  const tierName = getAchievementDiaryTierName(event.data.tier) ?? "Unknown";
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex flex-col items-center justify-center col-span-1">
          <img
            src={AchievementDiaryIcon}
            className="size-9 object-contain drop-shadow-solid-sm"
          />
          <p className="font-runescape text-osrs-orange solid-text-shadow">
            {tierName}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold text-sm">
          Completed{" "}
          <span className="text-secondary-foreground">
            {areaName} {tierName}
          </span>{" "}
          Diary
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function RenderCombatAchievementTierCompletedEvent({
  event,
}: {
  event: Extract<
    ProfileRecentActivity,
    { type: typeof ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED }
  >;
}) {
  const tierIcon =
    CombatAchievementTierIcons[
      event.data.tierId as unknown as keyof typeof CombatAchievementTierIcons
    ];
  const tierName = getCombatAchievementTierName(event.data.tierId) ?? "Unknown";
  const shortTierName = tierName === "Grandmaster" ? "GM" : tierName;
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex flex-col items-center justify-center col-span-1">
          <img src={base64ImgSrc(tierIcon)} className="size-9 object-contain" />
          <p className="font-runescape text-osrs-orange solid-text-shadow">
            {shortTierName}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-78">
        <p className="font-semibold text-sm">
          Completed all tasks in the{" "}
          <span className="text-secondary-foreground">{tierName}</span> Combat
          Achievement Tier
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function RenderQuestCompletedEvent({
  event,
}: {
  event: Extract<
    ProfileRecentActivity,
    { type: typeof ActivityEventType.QUEST_COMPLETED }
  >;
}) {
  const quest = getQuestById(event.data.questId);
  const name = quest?.name ?? "Unknown";
  const points = quest?.points ?? 0;
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex flex-col items-center justify-center col-span-1">
          <img
            src={QuestIcon}
            className="size-9 object-contain drop-shadow-solid-sm"
          />
          <p className="font-runescape text-osrs-orange solid-text-shadow">
            {points} {points === 1 ? "pt" : "pts"}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold text-sm">
          Completed <span className="text-secondary-foreground">{name}</span>{" "}
          Quest
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
