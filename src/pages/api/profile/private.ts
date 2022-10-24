import type { NextApiRequest, NextApiResponse } from "next";
import { PlayerDataSchema } from "@/lib/data-schema";
import { z } from "zod";
import { generatePath } from "@/lib/generate-path";
import { prisma } from "@/server/prisma";
import { startRevalidateTask } from "@/lib/start-revalidate-task";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    return putHandler(req, res);
  }

  return res.status(405); // Method not allowed
}

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  isPrivate: z.boolean(),
});

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { accountHash, isPrivate } = PutBodySchema.parse(req.body);

  const updatedAccount = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      isPrivate,
      generatedPath: generatePath(),
    },
    select: {
      accountHash: true,
      isPrivate: true,
      generatedPath: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).end();
  }

  await startRevalidateTask(req, updatedAccount.accountHash);

  return res.status(200).json({
    isPrivate: updatedAccount.isPrivate,
    generatedPath: updatedAccount.generatedPath,
  });
}
