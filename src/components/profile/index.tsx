import { Suspense } from "react";

import { ProfileFull } from "~/lib/domain/profile-data-types";
import { getCombatLevelFromSkills } from "~/lib/helpers/xp-and-levels";
import { getDateString } from "~/lib/utils/time";
import { Card } from "~/components/card";
import { PlayerDisplay } from "~/components/model/player-display";
import { AchievementDiaries } from "~/components/profile/achievement-diaries";
import { CollectionLog } from "~/components/profile/collection-log";
import { CombatAchievements } from "~/components/profile/combat-achievements";
import { Hiscores } from "~/components/profile/hiscores";
import { QuestList } from "~/components/profile/quest-list";
import { Skills } from "~/components/profile/skills";

type ProfileProps = {
  profile: ProfileFull;
};

export const Profile: React.FC<ProfileProps> = ({ profile }) => {
  const playerDisplay = (
    <PlayerDisplay
      accountType={profile.accountType}
      description={profile.description ?? ""}
      username={profile.username}
      modelUri={profile.modelUri}
      combatLevel={getCombatLevelFromSkills(profile.skills)}
      createdAt={getDateString(profile.createdAt)}
      updatedAt={getDateString(profile.updatedAt)}
    />
  );

  return (
    <div className="flex justify-center gap-6">
      {/* Large display */}
      <div className="hidden 1.5xl:block">{playerDisplay}</div>
      <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:flex-wrap 1.5xl:max-w-[1120px]">
        {/* Small display */}
        <div className="block 1.5xl:hidden">{playerDisplay}</div>

        <Skills skills={profile.skills} />

        <QuestList questList={profile.questList} />

        <AchievementDiaries achievementDiaries={profile.achievementDiaries} />

        <Suspense
          fallback={
            <Card
              iconPath="/assets/hiscores/hiscore.png"
              className="flex w-[260px] flex-col p-4"
            />
          }
        >
          <Hiscores hiscores={profile.hiscores} />
        </Suspense>

        <CombatAchievements combatAchievements={profile.combatAchievements} />

        <CollectionLog
          username={profile.username}
          collectionLog={profile.collectionLog}
        />
      </div>
    </div>
  );
};
