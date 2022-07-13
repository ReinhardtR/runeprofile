import { Card } from "@/components/Card";
import { CollectionLog } from "@/components/Profile/CollectionLog";
import { PlayerModel } from "@/components/Profile/PlayerModel";
import { SkillsCard } from "@/components/Profile/SkillsCard";
import type { InferNextProps } from "@/lib/infer-next-props-type";
import { prisma } from "db/client";
import type { GetStaticPropsContext, NextPage } from "next";
import { useState } from "react";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <div className="flex min-h-screen flex-wrap gap-4 p-4">
      <div>
        <Card>
          <div className="flex flex-col">
            <span className="text-center font-runescape text-4xl text-yellow-osrs">
              {account.username}
            </span>

            {/* TODO: fix size */}
            <div className="h-[286px] w-[200px]">
              <PlayerModel
                model={{
                  obj: account.modelObj,
                  mtl: account.modelMtl,
                }}
              />
            </div>
          </div>
        </Card>
      </div>

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

      <CollectionLog />
    </div>
  );
};

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  if (!username) {
    return { notFound: true } as const;
  }

  const [account] = await prisma.$transaction([
    prisma.account.findUnique({
      where: {
        username,
      },
      select: accountSelect,
    }),
  ]);

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
