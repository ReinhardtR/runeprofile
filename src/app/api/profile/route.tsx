import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { AccountNotFoundError } from "~/lib/data/errors";
import { getProfileFullWithHash } from "~/lib/data/profile/get-profile";
import { updateProfile } from "~/lib/data/profile/update-profile";
import {
  getFormattedPluginData,
  PlayerDataSchema,
} from "~/lib/domain/plugin-data-schema";
import { ProfileFullWithHash } from "~/lib/domain/profile-data-types";
import { getChangedData } from "~/lib/get-changed-data";
import {
  getProfilePaths,
  revalidateProfile,
} from "~/lib/helpers/revalidate-profile";
import { db } from "~/db";
import { accounts } from "~/db/schema";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsedPluginData = PlayerDataSchema.parse(body);
  const newData = getFormattedPluginData(parsedPluginData);
  let oldData: ProfileFullWithHash | null = null;

  try {
    oldData = await getProfileFullWithHash({
      accountHash: newData.accountHash,
    });
  } catch (e) {
    if (!(e instanceof AccountNotFoundError)) {
      throw e;
    }
  }

  const changedData = getChangedData(oldData, newData);

  await updateProfile({
    accountHash: newData.accountHash,
    username: newData.username,
    accountType: newData.accountType,
    questPoints: newData.questList.points,
    changedData,
  });

  await revalidateProfile({
    accountHash: newData.accountHash,
  });

  return new Response("ok", { status: 200 });
}

const DeleteParamsSchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
});

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const accountHashParam = params.get("accountHash");
  const parseResult = DeleteParamsSchema.safeParse({
    accountHash: accountHashParam,
  });
  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }
  const { accountHash } = parseResult.data;

  let paths: string[] = [];

  try {
    paths = await getProfilePaths({ accountHash });
  } catch (error) {
    return new Response("Failed to get profile paths", { status: 500 });
  }

  try {
    await db.delete(accounts).where(eq(accounts.accountHash, accountHash));
  } catch (error) {
    console.error(error);
    return new Response("Failed to delete account", { status: 500 });
  }

  try {
    for (const path of paths) {
      revalidatePath(path);
    }
  } catch (error) {
    return new Response("Failed to revalidate profile", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
