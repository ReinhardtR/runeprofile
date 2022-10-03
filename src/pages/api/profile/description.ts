import { PlayerDataSchema } from "@/lib/data-schema";
import { prisma } from "@/server/prisma";
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

  const result = await prisma.account.update({
    where: {
      accountHash: accountHash,
    },
    data: {
      description: description,
    },
    select: {
      description: true,
    },
  });

  if (!result) {
    return res.status(404).end();
  }

  return res.status(200).json({
    description: result.description,
  });
}
