import { Profile } from "@/components/Profile";
import { edgedb } from "@/server/db/client";
import { InferNextProps } from "@/utils/infer-next-props-type";
import {
  accountQuery,
  minimalAccountQueryByUsername,
} from "@/lib/account-query";
import type { NextPage } from "next";
import Image from "next/future/image";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({
  showcaseAccount,
}) => {
  return (
    <div className="min-w-screen bg-background-light min-h-screen flex flex-col justify-between">
      <main className="flex-1 flex flex-col items-center p-2 bg-background pt-20">
        <div className="container mx-auto p-2">
          <div className="relative rounded-xl overflow-hidden w-full h-[500px] shadow-xl flex justify-center items-center border-2 border-accent">
            <div className="absolute flex flex-col justify-center items-center z-20">
              <h1 className="text-7xl font-bold drop-shadow-solid">
                Share all of your
              </h1>
              <h1 className="text-7xl font-bold text-accent drop-shadow-solid">
                accomplishments
              </h1>
              <a
                href="https://runelite.net/plugin-hub"
                target="_blank"
                rel="noreferrer"
                className="flex space-x-2 items-center justify-center bg-accent/90 rounded-md shadow p-3 mt-8 hover:bg-accent hover:-translate-y-1 transform transition-all border-2 border-white/90"
              >
                <div className="relative w-8 h-8 bg-background rounded">
                  <Image
                    src="/assets/misc/runelite-logo.png"
                    fill
                    alt="RuneLite Logo"
                  />
                </div>
                <span className="text-background font-bold text-xl">
                  Get the Plugin
                </span>
              </a>
            </div>
            <div className="hero-image brightness-[60%] z-10"></div>
          </div>
        </div>
        <div className="container py-8">
          {/* Justi Guy */}
          <div className="absolute rotate-[5deg] mt-2 w-[400px] hidden md:block z-20">
            <span className="absolute text-osrs-yellow text-shadow font-runescape font-bold text-2xl animate-bounce">
              This is how your RuneProfile will look!
            </span>
          </div>

          <div className="absolute ml-8 -scale-x-100 drop-shadow-solid rotate-[7deg] mt-12 hidden md:block z-10">
            <Image
              src="/assets/hero/justi-armor-character.png"
              alt="OSRS character wearing Justiciar armor"
              width={200}
              height={800}
            />
          </div>

          <div className="mx-32 bg-background-light shadow-xl rounded-xl py-8 border-2 border-primary">
            <Profile account={showcaseAccount} />

            {/* Wise Old Man */}
            <div className="absolute -mt-60 right-0 -rotate-[5deg] w-[300px] hidden md:block z-20 xl:right-44">
              <span className="absolute text-osrs-yellow text-shadow font-runescape font-bold text-2xl animate-bounce text-center">
                Hover over an item to see when it was obtained!
              </span>
            </div>

            <div className="absolute right-0 -mt-52 z-10 -rotate-[7deg] hidden md:block xl:right-44 drop-shadow-solid">
              <Image
                src="/assets/hero/wise-old-man.png"
                alt="The Wise Old Man"
                width={200}
                height={800}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

export const getStaticProps = async () => {
  const minimalAccount = await minimalAccountQueryByUsername.run(edgedb, {
    username: "PGN",
  });

  if (!minimalAccount) {
    return {
      notFound: true,
    };
  }

  const account = await accountQuery.run(edgedb, {
    id: minimalAccount.id,
  });

  if (!account) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      showcaseAccount: account,
    },
  };
};
