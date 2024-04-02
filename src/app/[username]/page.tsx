import { Metadata } from "next";
import { Suspense, cache } from "react";
import { Skills } from "~/app/[username]/_components/Skills";
import { AchievementDiaries } from "~/app/[username]/_components/AchievementDiaries";
import { CombatAchievements } from "~/app/[username]/_components/CombatAchievements";
import { PlayerDisplay } from "~/components/Profile/PlayerDisplay";
import { QuestList } from "~/app/[username]/_components/QuestList";
import { getProfilFullWithHash } from "~/lib/data/get-profile";
import { getCombatLevelFromSkills } from "~/lib/helpers/xp-and-levels";
import { getDateString } from "~/lib/utils/time";
import { Hiscores } from "~/app/[username]/_components/Hiscores";
import { CollectionLog } from "~/app/[username]/_components/collection-log/CollectionLog";

const getProfilleCached = cache(getProfilFullWithHash);

// Prevent generating pages at build time
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: {
  params: { username: string };
}) {
  const profile = await getProfilleCached({
    username: props.params.username,
  });

  const title = `${profile.username} | RuneProfile`;
  const description = profile.description ?? "";
  const ogImageUrl = `https://runeprofile-git-next-13-app-dir-reinhardtr.vercel.app/api/og?username=${profile.username}`;

  const metadata: Metadata = {
    title,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "RuneProfile",
      url: `https://runeprofile.com/${profile.username}`,
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
  console.log("ProfilePage");
  const profile = await getProfilleCached({
    username: props.params.username,
  });

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
    // TODO: remove py-12
    <div className="flex justify-center gap-6 py-12">
      {/* Large display */}
      <div className="hidden 1.5xl:block">{playerDisplay}</div>
      <div className="flex sm:flex-wrap gap-6 justify-center items-center 1.5xl:max-w-[1120px] flex-col sm:flex-row">
        {/* Small display */}
        <div className="block 1.5xl:hidden">{playerDisplay}</div>

        <Skills skills={profile.skills} />

        <QuestList questList={profile.questList} />

        <AchievementDiaries achievementDiaries={profile.achievementDiaries} />

        <Suspense>
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
}
