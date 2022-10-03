import { PlayerDataSchema } from "@/lib/data-schema";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200);
}

// const BodySchema = z.object({
//   accountHash: PlayerDataSchema.shape.accountHash,
//   description: PlayerDataSchema.shape.description,
// });

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === "PUT") {
//     return putHandler(req, res);
//   }

//   return res.status(405); // Method not allowed
// }

// async function putHandler(req: NextApiRequest, res: NextApiResponse) {
//   const data = BodySchema.parse(req.body);

//   const updateDescription = e.select(
//     e.update(e.Account, (account) => ({
//       filter: e.op(account.account_hash, "=", data.accountHash),
//       set: {
//         description: data.description,
//       },
//     })),
//     () => ({
//       description: true,
//     })
//   );

//   try {
//     const result = await updateDescription.run(edgedb);

//     if (!result) {
//       throw new Error("Error updating account");
//     }

//     return res.status(200).json({
//       description: result.description,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error });
//   }
// }
