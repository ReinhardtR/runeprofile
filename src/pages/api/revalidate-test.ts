import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const query = z.object({
  username: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { username } = query.parse(req.query);

  console.log("Revalidating: ", username);

  try {
    await res.revalidate(`/${username}`);
    return res.json({ revalidated: true });
  } catch (e) {
    return res.status(500).send("Error revalidating");
  }
}
