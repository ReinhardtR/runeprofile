import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/server/prisma";
import { env } from "@/server/env";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    return postHandler(req, res);
  }

  return res.destroy();
}

const PostQueryParams = z.object({
  accountHash: z.string(),
  secretToken: z.string(),
  extraPaths: z.string(),
});

const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.query);

  const {
    accountHash,
    secretToken,
    extraPaths: _extraPaths,
  } = PostQueryParams.parse(req.query);

  const extraPaths: string[] = JSON.parse(_extraPaths);

  console.log("AccountHash", accountHash);
  console.log("SecretToken", secretToken);
  console.log("ExtraPaths", extraPaths);

  if (secretToken !== env.SECRET_TOKEN) {
    return res.destroy();
  }

  if (!accountHash) {
    return res.destroy();
  }

  const account = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    select: {
      username: true,
      generatedPath: true,
    },
  });

  if (!account) {
    return res.destroy();
  }

  const promises: Promise<any>[] = [];

  if (extraPaths) {
    extraPaths.forEach((path) => {
      promises.push(res.revalidate(`/u/${path}`));
    });
  }

  if (account.generatedPath) {
    promises.push(res.revalidate(`/u/${account.generatedPath}`));
  }

  promises.push(res.revalidate(`/u/${account.username}`));

  await Promise.all(promises);

  console.log("REVALIDATED");
  return res.destroy();
};
