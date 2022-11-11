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
  const queryStart = new Date();
  console.log("Query Start: ", queryStart.toUTCString());

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
      promises.push(res.revalidate(`/u/${path}`));
    });
  }

  if (account.generatedPath) {
    promises.push(res.revalidate(`/u/${account.generatedPath}`));
  }

  promises.push(res.revalidate(`/u/${account.username}`));

  await Promise.all(promises);

  const queryEnd = new Date();
  console.log("Query End: ", queryEnd.toUTCString());

  const queryTime = queryEnd.getTime() - queryStart.getTime();
  console.log("Query Time: ", queryTime / 1000, "s");

  return res.end();
};
