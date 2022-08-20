import { Profile } from "@/components/Profile";
import { client } from "@/lib/edgedb-client";
import { InferNextProps } from "@/lib/infer-next-props-type";
import { accountQuery } from "@/utils/accountQuery";
import type { NextPage } from "next";
import Image from "next/future/image";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({
  showcaseAccount,
}) => {
  return (
    <div className="min-w-screen bg-background-light min-h-screen flex flex-col justify-between">
      <main className="flex-1 flex flex-col items-center p-2 bg-background pt-20">
        <div className="container mx-auto p-2">
          <div className="relative rounded-xl overflow-hidden w-full h-[500px] shadow-xl flex justify-center items-center border-2 border-primary">
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
                className="flex space-x-2 items-center justify-center bg-accent/90 rounded-md shadow p-3 mt-8 hover:bg-accent hover:-translate-y-1 transform transition-all border-2 border-white/90"
              >
                <div className="relative w-8 h-8 bg-background rounded">
                  <Image src="/assets/misc/runelite-logo.png" fill />
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
          <div className="absolute rotate-[5deg] mt-2 w-[400px] hidden md:block z-20">
            <span className="absolute text-osrs-yellow text-shadow font-runescape font-bold text-2xl animate-bounce">
              This is how your RuneProfile will look !
            </span>
          </div>

          <div className="absolute ml-8 -scale-x-100 drop-shadow-solid rotate-[7deg] mt-12 hidden md:block z-10">
            <Image
              src="/assets/hero/justi-armor-character.png"
              width={200}
              height={800}
            />
          </div>

          <div className="mx-32 bg-background-light shadow-xl rounded-xl py-8 border-2 border-accent">
            <Profile account={showcaseAccount} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

export const getStaticProps = async () => {
  const account = await accountQuery.run(client, {
    username: "PGN",
  });

  if (!account) {
    return { notFound: true } as const;
  }

  return {
    props: {
      showcaseAccount: account,
    },
  };
};
