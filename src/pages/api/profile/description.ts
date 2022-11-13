import { PlayerDataSchema } from "@/lib/data-schema";
import { startRevalidateTask } from "@/lib/start-revalidate-task";
import { prisma } from "@/server/clients/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
  description: PlayerDataSchema.shape.description,
});

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { accountHash, description } = PutBodySchema.parse(req.body);

  const updatedAccount = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      description: description,
    },
    select: {
      accountHash: true,
      description: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).end();
  }

  await startRevalidateTask(req, updatedAccount.accountHash);

  return res.status(200).json({
    description: updatedAccount.description,
  });
}
