import { NextApiRequest, NextApiResponse } from "next";
import e from "@/edgeql";
import { edgedb } from "@/server/db/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const accountHash = Number(req.query.accountHash as string);

  if (!accountHash) return;

  const queryStart = new Date();
  console.log("Query Start: ", queryStart.toUTCString());

  const deleteQuery = e.select(
    e.delete(e.Account, (account) => ({
      filter: e.op(account.account_hash, "=", accountHash),
    })),
    () => ({
      username: true,
    })
  );

  try {
    const result = await deleteQuery.run(edgedb);

    if (!result) {
      throw new Error("Failed to get username");
    }

    await res.revalidate(`/u/${result.username}`);

    res.status(200).json({
      message: "Account succesfully deleted",
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      message: "Failed to delete account",
      error: e,
    });
  } finally {
    const queryEnd = new Date();
    console.log("Query End: ", queryEnd.toUTCString());

    const queryTime = queryEnd.getTime() - queryStart.getTime();
    console.log("Query Time: ", queryTime / 1000, "s");
  }
}
