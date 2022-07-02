import { PlayerModel } from "@/components/PlayerModel";
import { InferSSRProps } from "@/lib/infer-next-props-type";
import { prisma } from "db/client";
import type { GetServerSidePropsContext, NextPage } from "next";

const Home: NextPage<InferSSRProps<typeof getServerSideProps>> = ({ user }) => {
  return (
    <div>
      <main>
        <h1>{user.username}</h1>

        <PlayerModel model={user.model} />
      </main>
    </div>
  );
};

export default Home;

export const getServerSideProps = async ({
  params,
}: GetServerSidePropsContext) => {
  const username = params?.username as string;

  if (!username) {
    return { notFound: true } as const;
  }

  const user = await prisma.account.findUnique({
    where: {
      username,
    },
    select: {
      username: true,
      modelObj: true,
      modelMtl: true,
    },
  });

  if (!user) {
    return { notFound: true } as const;
  }

  return {
    props: {
      user: {
        username,
        model: {
          obj: user.modelObj.toString("utf-8"),
          mtl: user.modelMtl.toString("utf-8"),
        },
      },
    },
  };
};
