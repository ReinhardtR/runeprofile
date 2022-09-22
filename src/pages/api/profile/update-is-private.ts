import type { NextApiRequest, NextApiResponse } from "next";
import { PlayerDataSchema } from "@/lib/data-schema";
import { z } from "zod";
import e from "@/edgeql";
import { edgedb } from "@/server/db/client";
import { generatePath } from "@/lib/generate-path";

const inputSchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  isPrivate: z.boolean(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = inputSchema.parse(req.body);

  const updateQuery = e.select(
    e.update(e.Account, (account) => ({
      filter: e.op(account.account_hash, "=", data.accountHash),
      set: {
        is_private: data.isPrivate,
        generated_path: e.op(account.generated_path, "??", generatePath()),
      },
    })),
    () => ({
      username: true,
      is_private: true,
      generated_path: true,
    })
  );

  try {
    const result = await updateQuery.run(edgedb);

    if (!result) {
      throw new Error("Error updating account");
    }

    res.revalidate("/u/" + result.username);
    res.revalidate("/u/" + result.generated_path);

    res.status(200).json({
      isPrivate: result.is_private,
      generatedPath: result.generated_path,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}
