import Image from "next/image";
import Link from "next/link";

import { getProfileFull } from "~/lib/data/profile/get-profile";
import { Footer } from "~/components/footer";
import { Profile } from "~/components/profile";
import { AchievementDiaries } from "~/components/profile/achievement-diaries";
import { CollectionLog } from "~/components/profile/collection-log";
import { CombatAchievements } from "~/components/profile/combat-achievements";
import { Hiscores } from "~/components/profile/hiscores";
import { QuestList } from "~/components/profile/quest-list";
import { Skills } from "~/components/profile/skills";
import { DataBarItem } from "~/app/_components/data-bar-item";
import heroImage from "~/assets/hero-image.png";

export default async function LandingPage() {
  const profile = await getProfileFull({
    username: "PGN",
  });

  return (
    <div className="flex flex-col">
      <div className="min-w-screen flex min-h-screen flex-col justify-between border-b border-primary bg-background shadow shadow-accent">
        <div className="z-30 flex flex-1 flex-col items-center pt-[20vh]">
          <div className="mb-16 mt-12 flex flex-col items-center justify-center space-y-2">
            <h1 className="text-5xl font-extrabold drop-shadow-solid md:text-6xl lg:text-7xl">
              <span className="text-secondary solid-text-shadow">RUNE</span>
              <span className="text-primary solid-text-shadow">PROFILE</span>
            </h1>
            <p className="text-md text-light-gray font-medium drop-shadow-solid-sm md:text-lg lg:text-xl">
              Share your OSRS achievements
            </p>
            <div className="mb-6 flex items-center justify-center space-x-4 rounded-full bg-black/75 px-5 py-3  shadow">
              <DataBarItem
                name="Skills"
                icon="/assets/icons/skills.png"
                content={<Skills skills={profile.skills} />}
              />
              <DataBarItem
                name="Quests"
                icon="/assets/icons/quest-list.png"
                content={<QuestList questList={profile.questList} />}
              />
              <DataBarItem
                name="Achievement Diaries"
                icon="/assets/icons/achievement-diaries.png"
                content={
                  <AchievementDiaries
                    achievementDiaries={profile.achievementDiaries}
                  />
                }
              />
              <DataBarItem
                name="Combat Achievements"
                icon="/assets/icons/combat-achievements.png"
                content={
                  <CombatAchievements
                    combatAchievements={profile.combatAchievements}
                  />
                }
              />
              <DataBarItem
                name="Collection Log"
                icon="/assets/icons/collection-log.png"
                content={
                  <CollectionLog
                    username={profile.username}
                    collectionLog={profile.collectionLog}
                  />
                }
              />
              <DataBarItem
                name="Hiscores"
                icon="/assets/hiscores/hiscore.png"
                content={<Hiscores hiscores={profile.hiscores} />}
              />
            </div>
          </div>
          <a
            href="https://runelite.net/plugin-hub/show/runeprofile"
            target="_blank"
            rel="noreferrer"
            className="flex transform items-center justify-center space-x-2 rounded-full border-2 border-secondary bg-black/75 px-4 py-1.5 font-medium shadow transition-all hover:scale-110"
          >
            <Image
              src="/assets/misc/runelite-logo.png"
              alt="RuneLite Plugin"
              width={32}
              height={32}
            />
            <span>RuneLite Plugin</span>
          </a>
          <Link
            href="#profile-example"
            className="absolute bottom-12 mx-auto transform font-medium text-primary-foreground opacity-75 transition-all hover:-translate-y-1 hover:opacity-100"
          >
            Scroll to Profile Example
          </Link>
        </div>
        <div className="absolute inset-0 z-20 h-full w-full bg-primary">
          <Image
            src={heroImage}
            placeholder="blur"
            quality={100}
            priority
            alt=""
            className="h-full w-full object-cover mix-blend-multiply"
          />
        </div>
      </div>

      <div
        id="profile-example"
        className="relative flex items-center justify-center py-16"
      >
        <Profile profile={profile} />
        <div className="absolute -bottom-52 right-10 hidden -rotate-[5deg] 2xl:block">
          <p className="text-shadow z-50 w-[300px] animate-bounce text-center font-runescape text-2xl font-bold text-osrs-yellow">
            Hover over an item to see when it was obtained!
          </p>

          <div className="z-30 ml-12 -rotate-[2deg] drop-shadow-solid">
            <Image
              src="/assets/hero/wise-old-man.png"
              alt="The Wise Old Man"
              width={200}
              height={800}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
