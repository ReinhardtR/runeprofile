import React from "react";

import {
  ActivityEventType,
  COLLECTION_LOG_ITEMS,
  MAX_SKILL_XP,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
import CombatAchievementTierIcons from "~/core/assets/combat-achievement-tier-icons.json";
import AchievementDiaryIcon from "~/core/assets/icons/achievement-diaries.png";
import QuestIcon from "~/core/assets/icons/quest.png";
import ITEM_ICONS from "~/core/assets/item-icons.json";
import MiscIcons from "~/core/assets/misc-icons.json";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import SkillIconsLarge from "~/core/assets/skill-icons-large.json";
import { GameIcon } from "~/shared/components/icons";
import {
  cn,
  itemIconUrl,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/shared/utils";

import type { ClanActivityEvent } from "../hooks";

export function ActivityContent(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center font-runescape text-lg gap-x-1">
      {props.children}
    </div>
  );
}

export function ActivityIcon(props: { children: React.ReactNode }) {
  return (
    <div className="size-9 flex flex-row items-center justify-center">
      {props.children}
    </div>
  );
}

export function ActivityAccount({
  account,
}: {
  account: ClanActivityEvent["account"];
}) {
  const accountTypeIcon =
    AccountTypeIcons[account.accountType.key as keyof typeof AccountTypeIcons];

  return (
    <div className="flex flex-row items-center gap-x-1.5">
      <GameIcon
        src={
          ClanRankIcons[String(account.clanIcon) as keyof typeof ClanRankIcons]
        }
        alt="Clan rank"
        size={16}
        className="drop-shadow-solid-sm"
      />
      {!!accountTypeIcon && (
        <GameIcon
          src={accountTypeIcon}
          alt={account.accountType.name}
          size={16}
          className="drop-shadow-solid text-xs"
        />
      )}
      <span className="font-bold text-lg font-runescape solid-text-shadow">
        {account.username}
      </span>
    </div>
  );
}

export const ActivityRenderMap = {
  [ActivityEventType.NEW_ITEM_OBTAINED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.NEW_ITEM_OBTAINED }
    >,
  ) => {
    const itemIcon =
      ITEM_ICONS[event.data.itemId as unknown as keyof typeof ITEM_ICONS];
    const itemName = COLLECTION_LOG_ITEMS[event.data.itemId] ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          {itemIcon ? (
            <GameIcon
              src={itemIcon}
              alt={itemName}
              size={26}
              className="z-10 drop-shadow-2xl mx-auto"
            />
          ) : (
            <img
              src={QuestionMarkImage}
              alt={itemName}
              className="z-10 drop-shadow-2xl object-contain mx-auto size-[26px]"
            />
          )}
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>obtained</span>
          <span className="text-secondary-foreground">
            {itemName ?? "Unknown Item"}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.LEVEL_UP]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.LEVEL_UP }
    >,
  ) => {
    const skillIcon =
      SkillIconsLarge[
        event.data.name.toLowerCase() as unknown as keyof typeof SkillIconsLarge
      ];
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={skillIcon}
            alt={event.data.name}
            size={26}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>reached level</span>
          <span className="text-secondary-foreground">
            {event.data.level} in {event.data.name}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.XP_MILESTONE]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.XP_MILESTONE }
    >,
  ) => {
    const skillIcon =
      SkillIconsLarge[
        event.data.name.toLowerCase() as unknown as keyof typeof SkillIconsLarge
      ];
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={skillIcon}
            alt={event.data.name}
            size={26}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>reached</span>
          <span
            className={cn("text-secondary-foreground", {
              "shimmer-text": event.data.xp >= MAX_SKILL_XP,
            })}
          >
            {numberWithAbbreviation(event.data.xp)} XP in {event.data.name}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED }
    >,
  ) => {
    const areaName =
      getAchievementDiaryAreaName(event.data.areaId) ?? "Unknown";
    const tierName = getAchievementDiaryTierName(event.data.tier) ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          <img
            src={AchievementDiaryIcon}
            className="size-7 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed the</span>
          <span className="text-secondary-foreground">
            {tierName} diary in {areaName}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED }
    >,
  ) => {
    const tierIcon =
      CombatAchievementTierIcons[
        event.data.tierId as unknown as keyof typeof CombatAchievementTierIcons
      ];
    const tierName =
      getCombatAchievementTierName(event.data.tierId) ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={tierIcon}
            alt={tierName}
            size={28}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed all</span>
          <span className="text-secondary-foreground">
            {tierName} Combat Achievements
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.QUEST_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.QUEST_COMPLETED }
    >,
  ) => {
    const quest = getQuestById(event.data.questId);
    return (
      <>
        <ActivityIcon>
          <img
            src={QuestIcon}
            alt="Quest"
            className="size-6.5 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed</span>
          <span className="text-secondary-foreground">
            {quest?.name ?? "Unknown"}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.MAXED]: (
    event: Extract<ClanActivityEvent, { type: typeof ActivityEventType.MAXED }>,
  ) => {
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={MiscIcons["max_cape"]}
            alt="Maxed"
            size={28}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>has</span>
          <span className="shimmer-text">Maxed</span>
          <span>all skills.</span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.VALUABLE_DROP]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.VALUABLE_DROP }
    >,
  ) => {
    return (
      <>
        <ActivityIcon>
          <img
            src={itemIconUrl(event.data.itemId)}
            className={cn("z-10 drop-shadow-2xl object-contain mx-auto")}
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>received a valuable drop worth</span>
          <span className="text-secondary-foreground">
            {numberWithDelimiter(event.data.value)} gp
          </span>
        </ActivityContent>
      </>
    );
  },
};
