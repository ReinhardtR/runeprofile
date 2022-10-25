import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/server/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.query.secretToken !== process.env.SECRET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method == "POST") {
    return postHandler(req, res);
  }

  return res.status(405).end();
}

const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const accountHash = req.query.accountHash as string;

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

  if (account.generatedPath) {
    await res.revalidate(`/u/${account.generatedPath}`);
  }

  await res.revalidate(`/u/${account.username}`);

  console.log("REVALIDATED");
  return res.status(200).end();
};
