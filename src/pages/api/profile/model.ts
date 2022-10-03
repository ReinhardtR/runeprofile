import { PlayerDataSchema } from "@/lib/data-schema";
import { uploadByteArray } from "@/server/firebase";
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

  const modelUri = await uploadByteArray({
    path: `${account.username}.ply`,
    byteArray: new Uint8Array(Buffer.from(model, "base64")),
  });

  const result = await prisma.account.update({
    where: {
      accountHash,
    },
    data: {
      modelUri,
    },
    select: {
      username: true,
      generatedPath: true,
    },
  });

  if (!result) {
    return res.status(404).end();
  }

  res.revalidate(`/u/${result.username}`);

  if (result.generatedPath) {
    res.revalidate(`/u/${result.generatedPath}`);
  }

  return res.status(200).end();
}
