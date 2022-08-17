import { Profile } from "@/components/Profile";
import { InferNextProps } from "@/lib/infer-next-props-type";
import { getAccountSerialized } from "@/utils/accountQuery";
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
            <Image src="/assets/gearman.png" width={200} height={800} />
          </div>

          <div className="mx-32 bg-background-light shadow-xl rounded-xl py-8 border-2 border-accent">
            <Profile account={showcaseAccount} />
          </div>
        </div>
      </main>
      <footer className="bg-background">
        <span>footer</span>
      </footer>
    </div>
  );
};

export default Home;

export const getStaticProps = async () => {
  const account = await getAccountSerialized("PGN");

  if (!account) {
    return { notFound: true } as const;
  }

  return {
    props: {
      showcaseAccount: {
        ...account,
        model: JSON.stringify(account.model),
      },
    },
  };
};
