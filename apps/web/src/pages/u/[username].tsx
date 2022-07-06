import { Card } from "@/components/Card";
import { PlayerModel } from "@/components/Profile/PlayerModel";
import { SkillsCard } from "@/components/Profile/SkillsCard";
import type { InferNextProps } from "@/lib/infer-next-props-type";
import { prisma } from "db/client";
import type { GetStaticPropsContext, NextPage } from "next";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <Card>
        <div className="flex flex-col">
          <span className="text-center font-runescape text-4xl text-yellow-osrs">
            {account.username}
          </span>

          <div className="h-[300px] w-[200px]">
            <PlayerModel
              model={{
                obj: account.modelObj,
                mtl: account.modelMtl,
              }}
            />
          </div>
        </div>
      </Card>

      <div>
        <SkillsCard
          accountSkills={{
            attack: account.attack,
            hitpoints: account.hitpoints,
            mining: account.mining,
            strength: account.strength,
            agility: account.agility,
            smithing: account.smithing,
            defence: account.defence,
            herblore: account.herblore,
            fishing: account.fishing,
            ranged: account.ranged,
            thieving: account.thieving,
            cooking: account.cooking,
            prayer: account.prayer,
            crafting: account.crafting,
            firemaking: account.firemaking,
            magic: account.magic,
            fletching: account.fletching,
            woodcutting: account.woodcutting,
            runecraft: account.runecraft,
            slayer: account.slayer,
            farming: account.farming,
            construction: account.construction,
            hunter: account.hunter,
          }}
          overallXP={account.overall}
        />
      </div>

      <div>
        <Card>
          <h3>Quests</h3>
        </Card>
      </div>

      <div>
        <Card>
          <h3>Achievement Diaries</h3>
        </Card>
      </div>

      <div>Collection Log</div>
    </div>
  );
};

// const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
//   return (
//     <div className="grid h-screen grid-cols-4 grid-rows-2 gap-4 p-4">
//       <div className="col-span-1 row-span-full">
//         <h2>{account.username}</h2>

//         <div className="h-full w-full">
//           <PlayerModel
//             model={{
//               obj: account.modelObj,
//               mtl: account.modelMtl,
//             }}
//           />
//         </div>
//       </div>

//       <div className="col-span-1">
//         <SkillsCard
//           accountSkills={{
//             attack: account.attack,
//             hitpoints: account.hitpoints,
//             mining: account.mining,
//             strength: account.strength,
//             agility: account.agility,
//             smithing: account.smithing,
//             defence: account.defence,
//             herblore: account.herblore,
//             fishing: account.fishing,
//             ranged: account.ranged,
//             thieving: account.thieving,
//             cooking: account.cooking,
//             prayer: account.prayer,
//             crafting: account.crafting,
//             firemaking: account.firemaking,
//             magic: account.magic,
//             fletching: account.fletching,
//             woodcutting: account.woodcutting,
//             runecraft: account.runecraft,
//             slayer: account.slayer,
//             farming: account.farming,
//             construction: account.construction,
//             hunter: account.hunter,
//           }}
//           overallXP={account.overall}
//         />
//       </div>

//       <div className="col-span-1">
//         <Card>
//           <h3>Quests</h3>
//         </Card>
//       </div>

//       <div className="col-span-1">
//         <Card>
//           <h3>Achievement Diaries</h3>
//         </Card>
//       </div>

//       <div className="col-span-3">Collection Log</div>
//     </div>
//   );
// };

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  if (!username) {
    return { notFound: true } as const;
  }

  const account = await prisma.account.findUnique({
    where: {
      username,
    },
    select: {
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
    },
  });

  if (!account) {
    return { notFound: true } as const;
  }

  return {
    props: {
      account: {
        ...account,
        updatedAt: account.updatedAt.toISOString(),
        modelObj: account.modelObj.toString("utf-8"),
        modelMtl: account.modelMtl.toString("utf-8"),
      },
    },
  };
};

export const getStaticPaths = async () => {
  const accounts = await prisma.account.findMany({
    select: { username: true },
  });

  return {
    paths: accounts.map((account) => ({
      params: { username: account.username },
    })),
    fallback: "blocking",
  };
};
