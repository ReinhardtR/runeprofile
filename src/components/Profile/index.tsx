import { AccountQueryResult } from "@/lib/account-query";
import { useMemo } from "react";
import { AchievementDiaries } from "./AchievementDiaries";
import { CollectionLog } from "./CollectionLog";
import { CombatAchievements } from "./CombatAchievements";
import { Hiscores } from "./Hiscores";
import { PlayerDisplay } from "./PlayerDisplay";
import { QuestList } from "./QuestList";
import { SkillsCard } from "./Skills";

type ProfileProps = {
  account: AccountQueryResult;
};

export const Profile: React.FC<ProfileProps> = ({ account }) => {
  const playerDisplay = useMemo(() => {
    return (
      <PlayerDisplay
        accountType={account.accountType}
        description={account.description}
        username={account.username}
        modelUri={account.modelUri}
        combatLevel={account.combatLevel}
        createdAt={account.createdAt}
        updatedAt={account.updatedAt}
      />
    );
  }, [
    account.accountType,
    account.description,
    account.username,
    account.modelUri,
    account.combatLevel,
  ]);

  return (
    <div className="flex justify-center gap-6">
      <div className="hidden 1.5xl:block">{playerDisplay}</div>
      <div className="flex sm:flex-wrap gap-6 justify-center items-center 1.5xl:max-w-[1120px] flex-col sm:flex-row">
        <div className="block 1.5xl:hidden">{playerDisplay}</div>

        <SkillsCard skills={account.skills} />

        {account.questList && <QuestList questList={account.questList} />}

        <AchievementDiaries achievementDiaries={account.achievementDiaries} />

        <Hiscores hiscores={account.hiscores} />

        {account.combatAchievements && (
          <CombatAchievements combatAchievements={account.combatAchievements} />
        )}

        <CollectionLog
          username={account.username}
          collectionLog={account.collectionLog}
        />
      </div>
    </div>
  );
};
