import { AccountSerializedType } from "@/utils/accountQuery";
import Image from "next/future/image";
import { Card } from "../Card";
import { AchievementDiaries } from "./AchievementDiaries";
import { CollectionLog } from "./CollectionLog";
import { CombatAchievements } from "./CombatAchievements";
import { PlayerModel } from "./PlayerModel";
import { QuestList } from "./QuestList";
import { SkillsCard } from "./SkillsCard";

type ProfileProps = {
  account: AccountSerializedType;
};

export const Profile: React.FC<ProfileProps> = ({ account }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Card className="flex max-w-[260px] flex-col">
        <div className="flex items-center justify-center space-x-2 pt-2">
          {account.account_type != "NORMAL" && (
            <div className="relative aspect-[10/13] w-[16px]">
              <Image
                src={`/assets/account-type/${account.account_type.toLowerCase()}.png`}
                alt={account.account_type}
                quality={100}
                fill
                className="drop-shadow-solid"
              />
            </div>
          )}
          <p className="text-shadow font-runescape text-2xl font-bold leading-none text-white">
            {account.username}
          </p>
        </div>

        <PlayerModel model={account.model} />
      </Card>

      <SkillsCard skills={account.skills} />

      <QuestList questList={account.quest_list} />

      <AchievementDiaries achievementDiaries={account.achievement_diaries} />

      <CollectionLog
        username={account.username}
        collectionLog={account.collection_log}
      />

      <CombatAchievements combatAchievements={account.combat_achievements} />
    </div>
  );
};
