import * as Tabs from "@radix-ui/react-tabs";
import React from "react";

import AchievementDiariesIcon from "~/core/assets/icons/achievement-diaries.png";
import CombatAchievementsIcon from "~/core/assets/icons/combat-achievements.png";
import QuestsIcon from "~/core/assets/icons/quest.png";
import SkillsIcon from "~/core/assets/icons/skills.png";
import { Card } from "~/features/profile/components/card";
import { AchievementDiaries } from "~/features/profile/components/achievement-diaries";
import { CombatAchievements } from "~/features/profile/components/combat-achievements";
import { QuestList } from "~/features/profile/components/quest-list";
import { Skills } from "~/features/profile/components/skills";

type DataTabsCardProps = {
  skills: React.ComponentProps<typeof Skills>["data"];
  quests: React.ComponentProps<typeof QuestList>["data"];
  achievementDiaries: React.ComponentProps<typeof AchievementDiaries>["data"];
  combatAchievements: React.ComponentProps<typeof CombatAchievements>["data"];
};

export function DataTabsCard({
  skills,
  quests,
  achievementDiaries,
  combatAchievements,
}: DataTabsCardProps) {
  return (
    <Tabs.Root defaultValue="skills">
      <Card className="shrink-0">
        <Tabs.List className="absolute -top-4 left-0 right-0 flex flex-row items-center justify-center gap-x-4">
          <IconTabsTrigger value="skills">
            <img src={SkillsIcon} className="size-7" />
          </IconTabsTrigger>
          <IconTabsTrigger value="quests">
            <img src={QuestsIcon} />
          </IconTabsTrigger>
          <IconTabsTrigger value="achievement-diaries">
            <img src={AchievementDiariesIcon} />
          </IconTabsTrigger>
          <IconTabsTrigger value="combat-achievements">
            <img src={CombatAchievementsIcon} />
          </IconTabsTrigger>
        </Tabs.List>
        <Tabs.Content value="skills" className="h-full">
          <Skills data={skills} />
        </Tabs.Content>
        <Tabs.Content value="quests" className="h-full">
          <QuestList data={quests} />
        </Tabs.Content>
        <Tabs.Content value="achievement-diaries" className="h-full">
          <AchievementDiaries data={achievementDiaries} />
        </Tabs.Content>
        <Tabs.Content value="combat-achievements" className="h-full">
          <CombatAchievements data={combatAchievements} />
        </Tabs.Content>
      </Card>
    </Tabs.Root>
  );
}

function IconTabsTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Trigger
      className="flex h-8 w-8 items-center justify-center focus:outline-none brightness-50 hover:brightness-100 data-[state=active]:brightness-100 drop-shadow-solid cursor-pointer"
      value={value}
    >
      {children}
    </Tabs.Trigger>
  );
}
