import { Profile } from "@/components/Profile";
import { InferNextProps } from "@/lib/infer-next-props-type";
import { getAccountSerialized } from "@/utils/accountQuery";
import type { NextPage } from "next";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({
  showcaseAccount,
}) => {
  return (
    <div className="min-w-screen bg-background-light min-h-screen flex flex-col justify-between">
      <main className="flex-1 flex flex-col items-center p-2 bg-background pt-20">
        <div className="container mx-auto p-2">
          <div className="relative rounded-xl overflow-hidden w-full h-[500px] shadow-xl flex justify-center items-center">
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
        <div>
          <Profile account={showcaseAccount} />
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
