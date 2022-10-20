import type { NextApiRequest, NextApiResponse } from "next";
import { generatePath } from "@/lib/generate-path";
import { PlayerDataSchema } from "@/lib/data-schema";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { revalidateProfile } from "@/lib/revalidate-profile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    return putHandler(req, res);
  }

  return res.status(405).end(); // Method not allowed
}

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
});

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { accountHash } = PutBodySchema.parse(req.body);

  const oldAccount = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    select: {
      generatedPath: true,
    },
  });

  if (!oldAccount) {
    return res.status(404).end();
  }

  const updatedAccount = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      generatedPath: generatePath(),
    },
    select: {
      username: true,
      generatedPath: true,
      isPrivate: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).end();
  }

  await Promise.all([
    res.revalidate(`/u/${oldAccount.generatedPath}`),
    revalidateProfile(res, updatedAccount),
  ]);

  res.status(200).json({
    generatedPath: updatedAccount.generatedPath,
  });
}
