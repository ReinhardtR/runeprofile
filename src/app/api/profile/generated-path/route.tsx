import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { revalidateProfile } from "~/lib/helpers/revalidate-profile";
import { generatePath } from "~/lib/utils/generate-random-path";
import { db } from "~/db";
import { accounts } from "~/db/schema";

const PutBodySchema = z.object({
  accountHash: z.string(),
});

export async function PUT(request: Request) {
  const parseResult = PutBodySchema.safeParse(request.body);
  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }
  const { accountHash } = parseResult.data;

  const currentProfile = await db.query.accounts.findFirst({
    where: eq(accounts.accountHash, accountHash),
    columns: {
      generatedUrlPath: true,
    },
  });

  if (!currentProfile) {
    return new Response("Profile not found", { status: 404 });
  }

  const newGeneratedPath = generatePath();

  try {
    await db
      .update(accounts)
      .set({ generatedUrlPath: newGeneratedPath })
      .where(eq(accounts.accountHash, accountHash));
  } catch (error) {
    return new Response("Failed to update profile", { status: 500 });
  }

  if (currentProfile.generatedUrlPath) {
    revalidatePath(`/${currentProfile.generatedUrlPath}`);
  }

  try {
    await revalidateProfile({ accountHash });
  } catch (error) {
    return new Response("Failed to revalidate profile", { status: 500 });
  }

  return NextResponse.json({ generatedPath: newGeneratedPath });
}
