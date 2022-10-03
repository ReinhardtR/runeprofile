import type { NextApiRequest, NextApiResponse } from "next";
import { generatePath } from "@/lib/generate-path";
import { PlayerDataSchema } from "@/lib/data-schema";
import { z } from "zod";
import { prisma } from "@/server/prisma";

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

  const prevPath = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    select: {
      generatedPath: true,
    },
  });

  if (!prevPath) {
    return res.status(404).end();
  }

  const newPath = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      generatedPath: generatePath(),
    },
    select: {
      generatedPath: true,
    },
  });

  if (!newPath) {
    return res.status(404).end();
  }

  const revalidates: Promise<void>[] = [];

  if (prevPath.generatedPath) {
    revalidates.push(res.revalidate("/u/" + prevPath.generatedPath));
  }

  if (newPath.generatedPath) {
    revalidates.push(res.revalidate("/u/" + newPath.generatedPath));
  }

  await Promise.all(revalidates);

  res.status(200).json({
    generatedPath: newPath.generatedPath,
  });
}
