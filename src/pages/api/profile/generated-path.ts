import type { NextApiRequest, NextApiResponse } from "next";
import { generatePath } from "@/lib/generate-path";
import { PlayerDataSchema } from "@/lib/data-schema";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200);
}

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === "PUT") {
//     return putHandler(req, res);
//   }

//   return res.status(405); // Method not allowed
// }

// const BodySchema = z.object({
//   accountHash: PlayerDataSchema.shape.accountHash,
// });

// async function putHandler(req: NextApiRequest, res: NextApiResponse) {
//   const { accountHash } = BodySchema.parse(req.body);

//   const previousPathQuery = e.select(e.Account, (account) => ({
//     filter: e.op(account.account_hash, "=", accountHash),
//     generated_path: true,
//   }));

//   const updateQuery = e.select(
//     e.update(e.Account, (account) => ({
//       filter: e.op(account.account_hash, "=", accountHash),
//       set: {
//         generated_path: generatePath(),
//       },
//     })),
//     () => ({
//       generated_path: true,
//     })
//   );

//   try {
//     const previousPathResult = await previousPathQuery.run(edgedb);

//     if (!previousPathResult) {
//       throw new Error("Error updating account");
//     }

//     const newPathResult = await updateQuery.run(edgedb);

//     if (!newPathResult) {
//       throw new Error("Error updating account");
//     }

//     res.revalidate("/u/" + previousPathResult.generated_path);
//     res.revalidate("/u/" + newPathResult.generated_path);

//     res.status(200).json({
//       generatedPath: newPathResult.generated_path,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error });
//   }
// }
