import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { uploadModel } from "~/lib/data/model";
import { PlayerDataSchema } from "~/lib/domain/plugin-data-schema";
import { revalidateProfile } from "~/lib/helpers/revalidate-profile";
import { db } from "~/db";
import { accounts } from "~/db/schema";

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  model: z.string(),
});

export default async function PUT(request: Request) {
  const parseResult = PutBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }
  const { accountHash, model } = parseResult.data;

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.accountHash, accountHash),
    columns: {
      username: true,
    },
  });

  if (!account) {
    return new Response("Account not found", { status: 404 });
  }

  let modelUri: string | null = null;

  try {
    modelUri = await uploadModel({
      path: `models/${account.username}.ply`,
      buffer: Buffer.from(model, "base64"),
    });
  } catch (error) {
    return new Response("Failed to upload model to storage", { status: 500 });
  }

  try {
    await db
      .update(accounts)
      .set({ modelUri })
      .where(eq(accounts.accountHash, accountHash));
  } catch (error) {
    return new Response("Failed to update model URI", { status: 500 });
  }

  // TODO: is this needed?
  try {
    await revalidateProfile({ accountHash });
  } catch (error) {
    return new Response("Failed to revalidate profile", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
