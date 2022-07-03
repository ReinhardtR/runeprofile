import { PlayerModel } from "@/components/PlayerModel";
import type { InferNextProps } from "@/lib/infer-next-props-type";
import { prisma } from "db/client";
import type { GetStaticPropsContext, NextPage } from "next";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <div>
      <main>
        <h1>{account.username}</h1>

        <PlayerModel model={account.model} />

        <p>{account.woodcutting} XP</p>
      </main>
    </div>
  );
};

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
      woodcutting: true,
    },
  });

  if (!account) {
    return { notFound: true } as const;
  }

  return {
    props: {
      account: {
        username: account.username,
        woodcutting: account.woodcutting,
        model: {
          obj: account.modelObj.toString("utf-8"),
          mtl: account.modelMtl.toString("utf-8"),
        },
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
