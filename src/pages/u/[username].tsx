import type { InferNextProps } from "@/utils/infer-next-props-type";
import type { GetStaticPropsContext, NextPage } from "next";
import e, { $infer } from "@/edgeql";
import { edgedb } from "@/server/db/client";
import Head from "next/head";
import {
  accountQuery,
  minimalAccountQueryByGeneratedPath,
  minimalAccountQueryByUsername,
} from "@/lib/account-query";
import { Profile } from "@/components/Profile";

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
      <div className="flex flex-wrap justify-center p-4 min-h-screen pt-20">
        {account ? (
          <Profile account={account} />
        ) : (
          <div>This profile is private.</div>
        )}
      </div>
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
    };
  }

  // Max username length is 12
  const isGeneratedPath = username.length > 12;

  let minimalAccount: $infer<typeof minimalAccountQueryByUsername>;

  // This is kinda ugly, but TypeScript has a hard time
  // inferring the types in other ways.
  if (isGeneratedPath) {
    minimalAccount = await minimalAccountQueryByGeneratedPath.run(edgedb, {
      generated_path: username,
    });
  } else {
    minimalAccount = await minimalAccountQueryByUsername.run(edgedb, {
      username,
    });
  }

  // Account doesn't exist
  if (!minimalAccount) {
    return {
      notFound: true,
    } as const;
  }

  // Account exists, but isn't accesible by the username.
  if (!isGeneratedPath && minimalAccount.is_private) {
    return {
      props: {
        account: null,
      },
    };
  }

  // Account exists, is accesed by the private url and isn't private,
  // so redirect to username path.
  if (isGeneratedPath && !minimalAccount.is_private) {
    return {
      redirect: {
        destination: `/u/${minimalAccount.username}`,
        permanent: false,
      },
    };
  }

  const account = await accountQuery.run(edgedb, {
    id: minimalAccount.id,
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
  };
};

export const getStaticPaths = async () => {
  const accountsQuery = e.select(e.Account, () => ({
    username: true,
    is_private: true,
    generated_path: true,
  }));

  const accounts = await accountsQuery.run(edgedb);

  const paths = accounts.map((account) => {
    return {
      params: {
        username: account.is_private
          ? account.generated_path
          : account.username,
      },
    };
  });

  return {
    paths,
    fallback: "blocking",
  };
};
