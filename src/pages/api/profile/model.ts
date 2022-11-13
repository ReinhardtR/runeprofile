import { PlayerDataSchema } from "@/lib/data-schema";
import { startRevalidateTask } from "@/lib/start-revalidate-task";
import { uploadModel } from "@/server/clients/cloud-storage";
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

  return res.status(405).end(); // Method not allowed
}

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  model: z.string(),
});

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { accountHash, model } = PutBodySchema.parse(req.body);

  const account = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    select: {
      username: true,
    },
  });

  if (!account) {
    return res.status(404).end();
  }

  const modelUri = await uploadModel({
    path: `models/${account.username}.ply`,
    buffer: Buffer.from(model, "base64"),
  });

  const updatedAccount = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      modelUri,
    },
    select: {
      accountHash: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).end();
  }

  await startRevalidateTask(req, updatedAccount.accountHash);

  return res.status(200).end();
}
