import { AccountQueryResult } from "@/lib/account-query";
import Image from "next/future/image";
import { Card } from "../Card";
import { AchievementDiaries } from "./AchievementDiaries";
import { CollectionLog } from "./CollectionLog";
import { CombatAchievements } from "./CombatAchievements";
import { Hiscores } from "./Hiscores";
import { PlayerModel } from "./PlayerModel";
import { QuestList } from "./QuestList";
import { SkillsCard } from "./Skills";

type ProfileProps = {
  account: AccountQueryResult;
};

export const Profile: React.FC<ProfileProps> = ({ account }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Card className="flex max-w-[260px] flex-col">
        <div className="absolute inset-x-0 mx-auto flex flex-wrap justify-center items-center text-shadow font-runescape text-2xl font-bold leading-none space-x-4 p-2 z-20">
          <div className="flex items-center space-x-2">
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
            <span className="text-white">{account.username}</span>
          </div>

          <div className="flex space-x-1 justify-center items-center text-osrs-orange">
            <div className="relative w-5 h-5">
              <Image
                src="/assets/skill-icons/combat.png"
                alt="Combat Level"
                fill
                className="drop-shadow-xl"
              />
            </div>
            <span>{account.combat_level}</span>
          </div>
        </div>

        <div className="relative h-full flex flex-col justify-end items-center">
          <div className="h-[90%]">
            <PlayerModel model={account.model} />
          </div>
        </div>

        {account.description && (
          <div className="absolute bottom-4 left-0 w-full px-4">
            <p className="bg-black/50 text-xs text-light-gray p-2 rounded border border-osrs-border">
              {account.description}
            </p>
          </div>
        )}
      </Card>

      <SkillsCard skills={account.skills} />

      <QuestList questList={account.quest_list} />

      <AchievementDiaries achievementDiaries={account.achievement_diaries} />

      <CombatAchievements combatAchievements={account.combat_achievements} />

      <Hiscores hiscores={account.hiscores} />

      <CollectionLog
        username={account.username}
        collectionLog={account.collection_log}
      />
    </div>
  );
};
