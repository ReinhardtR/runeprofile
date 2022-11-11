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

  return res.end();
}

const PostQueryParams = z.object({
  accountHash: z.string(),
  secretToken: z.string(),
  extraPaths: z.string(),
});

const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    accountHash,
    secretToken,
    extraPaths: _extraPaths,
  } = PostQueryParams.parse(req.query);

  const extraPaths: string[] = JSON.parse(_extraPaths);

  if (secretToken !== env.SECRET_TOKEN) {
    return res.end();
  }

  if (!accountHash) {
    return res.end();
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
    return res.end();
  }

  const promises: Promise<any>[] = [];

  if (extraPaths) {
    extraPaths.forEach((path) => {
      promises.push(res.revalidate(`/${path}`));
    });
  }

  if (account.generatedPath) {
    promises.push(res.revalidate(`/${account.generatedPath}`));
  }

  promises.push(res.revalidate(`/${account.username}`));

  await Promise.all(promises);

  return res.end();
};
