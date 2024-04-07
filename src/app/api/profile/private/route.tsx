import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { PlayerDataSchema } from "~/lib/domain/plugin-data-schema";
import { revalidateProfile } from "~/lib/helpers/revalidate-profile";
import { generatePath } from "~/lib/utils/generate-random-path";
import { db } from "~/db";
import { accounts } from "~/db/schema";

const PutBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
  isPrivate: z.boolean(),
});

export async function PUT(request: Request) {
  const parseResult = PutBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }
  const { accountHash, isPrivate } = parseResult.data;

  const currentAccount = await db.query.accounts.findFirst({
    where: eq(accounts.accountHash, accountHash),
    columns: {
      isPrivate: true,
      generatedUrlPath: true,
    },
  });

  if (!currentAccount) {
    return new Response("Account not found", { status: 404 });
  }

  if (currentAccount.isPrivate === isPrivate) {
    return new Response(`Account privacy is already set to ${isPrivate}`, {
      status: 400,
    });
  }

  const newGeneratedPath = isPrivate ? generatePath() : null;

  try {
    await db
      .update(accounts)
      .set({
        isPrivate,
        generatedUrlPath: newGeneratedPath,
      })
      .where(eq(accounts.accountHash, accountHash));
  } catch (error) {
    return new Response("Failed to update privacy", { status: 500 });
  }

  if (currentAccount.generatedUrlPath) {
    revalidatePath(`/${currentAccount.generatedUrlPath}`);
  }

  try {
    await revalidateProfile({ accountHash });
  } catch (error) {
    return new Response("Failed to revalidate profile", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
