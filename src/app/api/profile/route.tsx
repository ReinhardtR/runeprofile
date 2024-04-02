import {
  AccountNotFoundError,
  getProfilFullWithHash,
} from "~/lib/data/get-profile";
import { readFile } from "fs/promises";
import {
  PlayerDataSchema,
  getFormattedPluginData,
} from "~/lib/domain/plugin-data-schema";
import { NextResponse } from "next/server";
import { getChangedData } from "~/lib/get-changed-data";
import { updateProfile } from "~/lib/data/update-profile";
import { ProfileFullWithHash } from "~/lib/domain/profile-data-types";

export async function GET(request: Request) {
  const rawPluginData = await readFile("PGN-update.json");
  const parsedPluginData = PlayerDataSchema.parse(
    JSON.parse(rawPluginData.toString())
  );
  const newData = getFormattedPluginData(parsedPluginData);
  let oldData: ProfileFullWithHash | null = null;

  try {
    oldData = await getProfilFullWithHash({
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

  return NextResponse.json({ success: true });
}
