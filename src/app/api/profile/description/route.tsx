import { eq } from "drizzle-orm";
import { z } from "zod";

import { PlayerDataSchema } from "~/lib/domain/plugin-data-schema";
import { revalidateProfile } from "~/lib/helpers/revalidate-profile";
import { db } from "~/db";
import { accounts } from "~/db/schema";

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  description: PlayerDataSchema.shape.description,
});

export default async function PUT(request: Request) {
  const parseResult = PutBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }

  const { accountHash, description } = parseResult.data;

  try {
    await db
      .update(accounts)
      .set({ description })
      .where(eq(accounts.accountHash, accountHash));
  } catch (error) {
    return new Response("Failed to update description", { status: 500 });
  }

  try {
    await revalidateProfile({ accountHash });
  } catch (error) {
    return new Response("Failed to revalidate profile", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
