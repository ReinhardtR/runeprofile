import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import {
  AccountNotFoundByHashError,
  AccountNotFoundByUsernameError,
} from "~/lib/data/errors";
import { db } from "~/db";
import { accounts } from "~/db/schema";

type FindAccountOptions =
  | {
      accountHash: string;
      username?: never;
    }
  | {
      username: string;
      accountHash?: never;
    };

export const getProfilePaths = async ({
  accountHash,
  username,
}: FindAccountOptions) => {
  const account = await db.query.accounts.findFirst({
    columns: {
      username: true,
      generatedUrlPath: true,
    },
    where: accountHash
      ? eq(accounts.accountHash, accountHash)
      : eq(accounts.username, username!),
  });

  if (!account) {
    if (accountHash) {
      throw new AccountNotFoundByHashError(accountHash);
    } else if (username) {
      throw new AccountNotFoundByUsernameError(username);
    } else {
      throw new Error("Invalid options");
    }
  }

  const paths = [`/${account.username}`];
  if (account.generatedUrlPath) {
    paths.push(`/${account.generatedUrlPath}`);
  }

  return paths;
};

export const revalidateProfile = async (params: FindAccountOptions) => {
  const paths = await getProfilePaths(params);
  for (const path of paths) {
    revalidatePath(path);
  }
};
