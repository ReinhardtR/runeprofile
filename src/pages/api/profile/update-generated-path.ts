import type { NextApiRequest, NextApiResponse } from "next";
import e from "@/edgeql";
import { edgedb } from "@/server/db/client";
import { generatePath } from "@/lib/generate-path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("API CALLED");
  const accountHash = Number(req.query.accountHash as string);

  if (!accountHash) return;

  const updateQuery = e.select(
    e.update(e.Account, (account) => ({
      filter: e.op(account.account_hash, "=", accountHash),
      set: {
        generated_path: generatePath(),
      },
    })),
    () => ({
      generated_path: true,
    })
  );

  try {
    const result = await updateQuery.run(edgedb);

    if (!result) {
      throw new Error("Error updating account");
    }

    res.revalidate("/u/" + result.generated_path);

    res.status(200).json({
      generatedPath: result.generated_path,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}
