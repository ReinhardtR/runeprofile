import { Card } from "@/components/Card";
import { CollectionLog } from "@/components/Profile/CollectionLog";
import { PlayerModel } from "@/components/Profile/PlayerModel";
import { SkillsCard } from "@/components/Profile/SkillsCard";
import type { InferNextProps } from "@/lib/infer-next-props-type";
import type { GetStaticPropsContext, NextPage } from "next";
import fakeData from "@/assets/fake-data.json";
import { PlayerDataSchema } from "@/lib/data-schema";
import { AchievementDiaries } from "@/components/Profile/AchievementDiaries";
import { CombatAchievements } from "@/components/Profile/CombatAchievements";
import { QuestList } from "@/components/Profile/QuestList";
import Image from "next/future/image";
import { BossKillCounts } from "@/components/Profile/BossKillCounts";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <div className="flex min-h-screen flex-wrap justify-center gap-4 p-4">
      <Card className="flex max-w-[260px] flex-col">
        <div className="flex items-center justify-center space-x-2 pt-2">
          {/* TODO: use enum from edgedb */}
          {account.accountType != "NORMAL" && (
            <div className="relative aspect-[10/13] w-[20px]">
              <Image
                src={`/assets/account-type/${account.accountType.toLowerCase()}.png`}
                alt={account.accountType}
                quality={100}
                fill
                className="drop-shadow-solid"
              />
            </div>
          )}
          <p className="text-shadow font-runescape text-4xl font-bold leading-none text-white">
            {account.username}
          </p>
        </div>

        <PlayerModel model={account.model} />
      </Card>

      <SkillsCard skills={account.skills} />

      <QuestList />

      <AchievementDiaries />

      <CollectionLog collectionLog={account.collectionLog} />

      <CombatAchievements />

      {/* <BossKillCounts /> */}
    </div>
  );
};

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  if (username != "test") {
    return { notFound: true } as const;
  }

  const account = PlayerDataSchema.parse(fakeData);

  return {
    props: {
      account: {
        ...account,
        model: {
          obj: account.model.obj.toString("utf-8"),
          mtl: account.model.mtl.toString("utf-8"),
        },
      },
    },
  };
};

export const getStaticPaths = async () => {
  // const accounts = await prisma.account.findMany({
  //   select: { username: true },
  // });

  // return {
  //   paths: accounts.map((account) => ({
  //     params: { username: account.username },
  //   })),
  //   fallback: "blocking",
  // };

  return {
    paths: [{ params: { username: "test" } }],
    fallback: "blocking",
  };
};
