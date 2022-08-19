import type { InferNextProps } from "@/lib/infer-next-props-type";
import type { GetStaticPropsContext, NextPage } from "next";
import e from "@/edgeql";
import { client } from "@/lib/edgedb-client";
import Head from "next/head";
import { accountQuery } from "@/utils/accountQuery";
import { Profile } from "@/components/Profile";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <>
      <Head>
        <title>{account.username} - RuneProfile</title>
      </Head>
      <div className="flex flex-wrap justify-center p-4 min-h-screen pt-20">
        <Profile account={account} />
      </div>
    </>
  );
};

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  const account = await accountQuery.run(client, {
    username,
  });

  if (!account) {
    return null;
  }

  return {
    props: {
      account,
    },
  };
};

export const getStaticPaths = async () => {
  const accountsQuery = e.select(e.Account, () => ({
    username: true,
  }));

  const accounts = await accountsQuery.run(client);

  return {
    paths: accounts.map((account) => ({
      params: { username: account.username },
    })),
    fallback: "blocking",
  };
};
