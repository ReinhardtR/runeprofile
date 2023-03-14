import { cache } from "react";
import { SkillsCard } from "~/app/[username]/(components)/Skills";
import { AchievementDiaries } from "~/components/Profile/AchievementDiaries";
import { CollectionLog } from "~/components/Profile/CollectionLog/CollectionLogRoot";
import { CombatAchievements } from "~/components/Profile/CombatAchievements";
import { Hiscores } from "~/components/Profile/Hiscores";
import { PlayerDisplay } from "~/components/Profile/PlayerDisplay";
import { QuestList } from "~/components/Profile/QuestList";
import { getAccounts, getFullAccount } from "~/lib/domain/account";
import { getDateString } from "~/utils/time";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const accounts = await getAccounts();

  return accounts.map((account) => ({
    username: account.isPrivate ? account.generatedPath : account.username,
  }));
}

const cacheAccount = cache(async (username: string) =>
  getFullAccount(username)
);

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: {
    username: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const account = await cacheAccount(params.username);

  if (!account) {
    return <div>Not found</div>;
  }

  return (
    <div className="flex justify-center gap-6">
      <div className="hidden 1.5xl:block">
        <PlayerDisplay
          accountType={account.accountType}
          description={account.description}
          username={account.username}
          modelUri={account.modelUri}
          combatLevel={account.combatLevel}
          createdAt={getDateString(account.createdAt!)}
          updatedAt={getDateString(account.updatedAt)}
        />
      </div>
      <div className="flex sm:flex-wrap gap-6 justify-center items-center 1.5xl:max-w-[1120px] flex-col sm:flex-row">
        <div className="block 1.5xl:hidden">
          <PlayerDisplay
            accountType={account.accountType}
            description={account.description}
            username={account.username}
            modelUri={account.modelUri}
            combatLevel={account.combatLevel}
            createdAt={getDateString(account.createdAt!)}
            updatedAt={getDateString(account.updatedAt)}
          />
        </div>

        <SkillsCard skills={account.skills} />

        {account.questList && <QuestList questList={account.questList} />}

        <AchievementDiaries achievementDiaries={account.achievementDiaries} />

        <Hiscores hiscores={account.hiscores} />

        {account.combatAchievements && (
          <CombatAchievements
            combatAchievements={{
              tiers: account.combatAchievements,
            }}
          />
        )}

        <CollectionLog
          username={account.username}
          collectionLog={account.collectionLog}
          selectedTab={searchParams?.["clog-tab"] as string | undefined}
          selectedEntry={searchParams?.["clog-entry"] as string | undefined}
        />
      </div>
    </div>
  );
}
