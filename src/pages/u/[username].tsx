import type { InferNextProps } from "@/utils/infer-next-props-type";
import type { GetStaticPropsContext, NextPage } from "next";
import { prisma } from "@/server/prisma";
import Head from "next/head";
import {
  accountQuery,
  minimalAccountQueryByGeneratedPath,
  minimalAccountQueryByUsername,
} from "@/lib/account-query";
import { Profile } from "@/components/Profile";
import { MainLayout } from "@/components/MainLayout";

const Home: NextPage<InferNextProps<typeof getStaticProps>> = ({ account }) => {
  return (
    <>
      <Head>
        {account ? (
          <title>{`${account.username} - RuneProfile`}</title>
        ) : (
          <title>RuneProfile</title>
        )}
      </Head>
      <MainLayout>
        <div className="flex flex-wrap justify-center p-4 min-h-screen pt-24 pb-32">
          {account ? (
            <div className="py-2">
              <Profile account={account} />
            </div>
          ) : (
            <div>This profile is private.</div>
          )}
        </div>
      </MainLayout>
    </>
  );
};

export default Home;

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const username = params?.username as string;

  // No username passed
  if (!username) {
    return {
      notFound: true,
    } as const;
  }

  // Max username length is 12
  const isGeneratedPath = username.length > 12;

  const minimalAccountQuery = isGeneratedPath
    ? minimalAccountQueryByGeneratedPath
    : minimalAccountQueryByUsername;

  const minimalAccount = await minimalAccountQuery(username);

  // No account found
  if (!minimalAccount) {
    return {
      notFound: true,
    } as const;
  }

  // Account exists, but isn't accesible by the username.
  if (!isGeneratedPath && minimalAccount.isPrivate) {
    return {
      props: {
        account: null,
      },
    } as const;
  }

  // Account exists, is accesed by the private url and isn't private,
  // so redirect to username path.
  if (isGeneratedPath && !minimalAccount.isPrivate) {
    return {
      redirect: {
        destination: `/u/${minimalAccount.username}`,
        permanent: false,
      },
    } as const;
  }

  const account = await accountQuery({
    accountHash: minimalAccount.accountHash,
  });

  // Second account query failed for some reason.
  if (!account) {
    return {
      notFound: true,
    } as const;
  }

  return {
    props: {
      account,
    },
  } as const;
};

export const getStaticPaths = async () => {
  const accounts = await prisma.account.findMany({
    select: {
      username: true,
      isPrivate: true,
      generatedPath: true,
    },
  });

  const paths = accounts.map((account) => {
    return {
      params: {
        username: account.isPrivate ? account.generatedPath : account.username,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};
