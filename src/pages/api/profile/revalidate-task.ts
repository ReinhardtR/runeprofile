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

  return res.status(405).end();
}

const PostBody = z.object({
  accountHash: z.string(),
  secretToken: z.string(),
  extraPaths: z.array(z.string()).optional(),
});

const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { accountHash, secretToken, extraPaths } = PostBody.parse(req.body);

  if (req.query.secretToken !== env.SECRET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!accountHash) {
    return res.status(200).end();
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
    return res.status(200).end();
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
