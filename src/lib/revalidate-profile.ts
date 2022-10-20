import { prisma } from "@/server/prisma";
import { NextApiResponse } from "next";

export async function getProfileAndRevalidate(
  res: NextApiResponse,
  accountHash: bigint
) {
  const profile = await prisma.account.findUnique({
    where: {
      accountHash,
    },
    select: {
      username: true,
      generatedPath: true,
      isPrivate: true,
    },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  return revalidateProfile(res, profile);
}

export async function revalidateProfile(
  res: NextApiResponse,
  {
    username,
    generatedPath,
    isPrivate,
  }: {
    username: string;
    generatedPath: string | null;
    isPrivate: boolean;
  }
) {
  if (isPrivate && generatedPath) {
    await res.revalidate(`/u/${generatedPath}`);
  } else {
    await res.revalidate(`/u/${username}`);
  }
}
