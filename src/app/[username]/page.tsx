import { Metadata } from "next";
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

// should be "error", look at this issue: https://github.com/vercel/next.js/issues/46694
export const dynamic = "force-static";

const getFullAccountCached = cache(async (username: string) => {
  return getFullAccount(username);
});

export async function generateStaticParams() {
  const accounts = await getAccounts();

  return accounts.map((account) => ({
    username: account.isPrivate ? account.generatedPath : account.username,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  const account = await getFullAccountCached(params.username);

  const title = `${account.username} | RuneProfile`;
  const description = account.description;
  const ogImageUrl = `https://runeprofile-git-next-13-app-dir-reinhardtr.vercel.app/api/og?username=${account.username}`;

  const metadata: Metadata = {
    title,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "RuneProfile",
      url: `https://runeprofile.com/${account.username}`,
      images: [
        {
          // TODO: change to runeprofile.com when in prod
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
        },
      ],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [ogImageUrl],
    },
    robots: {
      index: true,
    },
  };

  return metadata;
}

export default async function ProfilePage(props: {
  params: {
    username: string;
  };
}) {
  const account = await getFullAccountCached(props.params.username);

  const playerDisplay = (
    <PlayerDisplay
      accountType={account.accountType}
      description={account.description}
      username={account.username}
      modelUri={account.modelUri}
      combatLevel={account.combatLevel}
      createdAt={getDateString(account.createdAt!)}
      updatedAt={getDateString(account.updatedAt)}
    />
  );

  return (
    <div className="flex justify-center gap-6">
      {/* Large display */}
      <div className="hidden 1.5xl:block">playerDisplay</div>
      <div className="flex sm:flex-wrap gap-6 justify-center items-center 1.5xl:max-w-[1120px] flex-col sm:flex-row">
        {/* Small display */}
        <div className="block 1.5xl:hidden">{playerDisplay}</div>

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
        />
      </div>
    </div>
  );
}
