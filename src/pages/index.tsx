import { Footer } from "@/components/Footer";
import { Tooltip } from "@/components/Misc/Tooltip";
import { Profile } from "@/components/Profile";
import { accountQuery } from "@/lib/account-query";
import { prisma } from "@/server/prisma";
import type { InferNextProps } from "@/utils/infer-next-props-type";
import { SearchIcon } from "@heroicons/react/outline";
import type { NextPage } from "next";
import Image from "next/future/image";
import { useSetAtom } from "jotai";
import { isSearchOpenAtom } from "@/components/SearchModal";
import heroImage from "@/assets/hero-image.png";

const DataIcon = ({
  name,
  tooltipText,
  iconSrc,
  width = 32,
  height = 32,
}: {
  name: string;
  tooltipText: string;
  iconSrc: string;
  width?: number;
  height?: number;
}) => {
  return (
    <Tooltip
      key={name}
      placement="top"
      content={<p className="font-medium">{tooltipText}</p>}
      transparent={false}
    >
      <div>
        <Image
          src={iconSrc}
          width={width}
          height={height}
          className="drop-shadow-solid-sm"
          quality={100}
        />
      </div>
    </Tooltip>
  );
};

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  const setIsSearchOpen = useSetAtom(isSearchOpenAtom);

  return (
    <div className="flex flex-col">
      <div className="min-w-screen bg-background-light min-h-screen flex flex-col justify-between border-b border-primary shadow shadow-accent">
        <main className="flex-1 flex flex-col items-center pt-[20vh] z-30">
          <div
            className="flex justify-between space-x-2 items-center rounded border-accent border-[2px] py-[6px] px-[7px] pr-2 text-accent shadow hover:cursor-pointer hover:border-primary transition-all hover:-translate-y-1"
            onClick={() => setIsSearchOpen(true)}
          >
            <div className="flex space-x-1 items-center">
              <SearchIcon className="w-[18px] h-[18px]" />
              <span className="text-sm font-meidum">
                Search for profiles...
              </span>
            </div>
            <span className="text-sm font-bold text-primary">Ctrl K</span>
          </div>
          <div className="flex flex-col justify-center items-center space-y-2 mt-12 mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold drop-shadow-solid">
              <span className="text-accent">RUNE</span>
              <span className="text-primary-light">PROFILE</span>
            </h1>
            <p className="text-md md:text-lg lg:text-xl text-light-gray drop-shadow-solid-sm font-medium">
              Share your OSRS achievements
            </p>
            <div className="flex justify-center items-center space-x-4 bg-black/75 py-3 px-5 rounded-full shadow  mb-6">
              <DataIcon
                name="Skills"
                iconSrc="/assets/icons/skills.png"
                width={31}
                height={31}
                tooltipText="Display your Skill Levels, Experience and Virtual Levels."
              />
              <DataIcon
                name="Quests"
                iconSrc="/assets/icons/quest-list.png"
                tooltipText="Display your Quest List including your Quest Points."
              />
              <DataIcon
                name="Achievement Diaries"
                iconSrc="/assets/icons/achievement-diaries.png"
                tooltipText="Display your progress in the Achievement Diaries."
              />
              <DataIcon
                name="Combat Achievements"
                iconSrc="/assets/icons/combat-achievements.png"
                tooltipText="Display your progress in the Combat Achievment tiers."
              />
              <DataIcon
                name="Collection Log"
                iconSrc="/assets/icons/collection-log.png"
                tooltipText="Display your Collection Log and track when you obtained an item."
              />
              <DataIcon
                name="Hiscores"
                iconSrc="/assets/hiscores/hiscore.png"
                width={31}
                height={31}
                tooltipText="Display your Hiscores ranks."
              />
            </div>
          </div>
          <a
            href="https://runelite.net/plugin-hub/show/runeprofile"
            target="_blank"
            rel="noreferrer"
            className="font-medium flex space-x-2 justify-center items-center rounded-full bg-black/75 border-2 border-accent py-1.5 px-4 shadow transform hover:-translate-y-1 hover:border-primary transition-all"
          >
            <Image
              src="/assets/misc/runelite-logo.png"
              width={32}
              height={32}
            />
            <span>RuneLite Plugin</span>
          </a>
          <a
            href="#profile-example"
            className="absolute bottom-12 mx-auto text-light-gray opacity-75 font-medium transform hover:opacity-100 hover:-translate-y-1 transition-all"
          >
            Scroll to Profile Example
          </a>
        </main>
        <div className="bg-primary z-20 h-screen inset-0 absolute">
          <Image
            src={heroImage}
            placeholder="blur"
            quality={100}
            priority
            alt=""
            className="object-cover max-h-full mix-blend-multiply"
          />
        </div>
      </div>
      {account && (
        <div
          id="profile-example"
          className="relative flex justify-center items-center py-16"
        >
          <Profile account={account} />
          <div className="absolute -bottom-52 hidden 2xl:block right-10 -rotate-[5deg]">
            <p className="w-[300px] text-osrs-yellow text-shadow font-runescape font-bold text-2xl animate-bounce text-center z-50">
              Hover over an item to see when it was obtained!
            </p>

            <div className="z-30 -rotate-[2deg] drop-shadow-solid ml-12">
              <Image
                src="/assets/hero/wise-old-man.png"
                alt="The Wise Old Man"
                width={200}
                height={800}
              />
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Home;

export const getStaticProps = async () => {
  const myAccount = await prisma.account.findUnique({
    where: {
      username: "PGN",
    },
    select: {
      accountHash: true,
    },
  });

  if (!myAccount) {
    return {
      notFound: true,
    } as const;
  }

  const account = await accountQuery({
    accountHash: myAccount.accountHash,
  });

  return {
    props: {
      account,
    },
  };
};
