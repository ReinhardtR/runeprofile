import { PlayerDataSchema } from "@/lib/data-schema";
import { NextApiRequest, NextApiResponse } from "next";
import e from "@/edgeql";
import { edgedb } from "@/server/db/client";
import { z } from "zod";

const ModelSchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  model: PlayerDataSchema.shape.model,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    return putHandler(req, res);
  }

  return res.status(405); // Method not allowed
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const data = ModelSchema.parse(req.body);

  const queryStart = new Date();
  console.log("Query Start: ", queryStart.toUTCString());

  const modelQuery = e.select(
    e.update(e.Account, (account) => ({
      set: {
        model: data.model,
      },
      filter: e.op(account.account_hash, "=", data.accountHash),
    })),
    () => ({
      username: true,
      generated_path: true,
    })
  );

  try {
    const result = await modelQuery.run(edgedb);

    if (!result) {
      throw new Error("Failed to update model");
    }

    res.revalidate(`/u/${result.username}`);

    if (result.generated_path) {
      res.revalidate(`/u/${result.generated_path}`);
    }

    res.status(200).json({
      message: "Model succesfully updated",
      error: null,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      message: "Failed to update model",
      error: e,
    });
  } finally {
    const queryEnd = new Date();
    console.log("Query End: ", queryEnd.toUTCString());

    const queryTime = queryEnd.getTime() - queryStart.getTime();
    console.log("Query Time: ", queryTime / 1000, "s");
  }
}
