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
import { AccountType } from "db";
import { BossKillCounts } from "@/components/Profile/BossKillCounts";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <div className="flex min-h-screen flex-wrap justify-center gap-4 p-4">
      <Card className="flex max-w-[260px] flex-col">
        <div className="flex items-center justify-center space-x-2 pt-2">
          {account.accountType != AccountType.NORMAL && (
            <Image
              src={`/assets/account-type/${account.accountType.toLowerCase()}.png`}
              quality={100}
              className="aspect-[10/13] w-[20px] drop-shadow-solid"
            />
          )}
          <p className="text-shadow font-runescape text-4xl font-bold leading-none text-white">
            {account.username}
          </p>
        </div>

        <PlayerModel
          model={{
            obj: account.model.obj,
            mtl: account.model.mtl,
          }}
        />
      </Card>

      <SkillsCard
        accountSkills={{
          attack: account.skills.attack,
          hitpoints: account.skills.hitpoints,
          mining: account.skills.mining,
          strength: account.skills.strength,
          agility: account.skills.agility,
          smithing: account.skills.smithing,
          defence: account.skills.defence,
          herblore: account.skills.herblore,
          fishing: account.skills.fishing,
          ranged: account.skills.ranged,
          thieving: account.skills.thieving,
          cooking: account.skills.cooking,
          prayer: account.skills.prayer,
          crafting: account.skills.crafting,
          firemaking: account.skills.firemaking,
          magic: account.skills.magic,
          fletching: account.skills.fletching,
          woodcutting: account.skills.woodcutting,
          runecraft: account.skills.runecraft,
          slayer: account.skills.slayer,
          farming: account.skills.farming,
          construction: account.skills.construction,
          hunter: account.skills.hunter,
        }}
        overallXP={account.skills.overall}
      />

      <QuestList />

      <AchievementDiaries />

      <CollectionLog collectionLog={account.collectionLog} />

      <CombatAchievements />

      <BossKillCounts />
    </div>
  );
};

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  // if (!username) {
  //   return { notFound: true } as const;
  // }

  // const [account] = await prisma.$transaction([
  //   prisma.account.findUnique({
  //     where: {
  //       username,
  //     },
  //     select: accountSelect,
  //   }),
  // ]);

  // if (!account) {
  //   return { notFound: true } as const;
  // }

  // return {
  //   props: {
  //     account: {
  //       ...account,
  //       updatedAt: account.updatedAt.toISOString(),
  //       modelObj: account.modelObj.toString("utf-8"),
  //       modelMtl: account.modelMtl.toString("utf-8"),
  //     },
  //   },
  // };

  if (username != "test") {
    return { notFound: true } as const;
  }

  const data = PlayerDataSchema.parse(fakeData);

  return {
    props: {
      account: data,
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

const accountSelect = {
  username: true,
  modelObj: true,
  modelMtl: true,
  agility: true,
  attack: true,
  cooking: true,
  construction: true,
  crafting: true,
  defence: true,
  farming: true,
  fishing: true,
  firemaking: true,
  fletching: true,
  herblore: true,
  hitpoints: true,
  hunter: true,
  magic: true,
  mining: true,
  prayer: true,
  ranged: true,
  runecraft: true,
  slayer: true,
  smithing: true,
  thieving: true,
  strength: true,
  woodcutting: true,
  overall: true,
  accountType: true,
  updatedAt: true,
  CollectionLog: {
    select: {
      totalItems: true,
      totalObtained: true,
      uniqueItems: true,
      uniqueObtained: true,
      CollectedItems: {
        select: {
          quantity: true,
          Item: {
            select: {
              id: true,
              name: true,
              ItemSources: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      KillCounts: {
        select: {
          name: true,
          amount: true,
          itemSourceName: true,
        },
      },
    },
  },
};
