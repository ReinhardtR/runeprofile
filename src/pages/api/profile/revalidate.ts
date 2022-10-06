import { prisma } from "@/server/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method != "GET") {
    return res.status(405);
  }

  const accountHash = req.query.accountHash as string;

  if (!accountHash) {
    return res.status(400).json({ error: "Missing accountHash" });
  }

  const profile = await prisma.account.findUnique({
    where: {
      accountHash: parseInt(accountHash),
    },
    select: {
      username: true,
      generatedPath: true,
      isPrivate: true,
    },
  });

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (profile.isPrivate && profile.generatedPath) {
    await res.revalidate(`/u/${profile.generatedPath}`);
  } else {
    await res.revalidate(`/u/${profile.username}`);
  }

  return res.status(200);
}
