import { hc } from "hono/client";

import type { Client } from "@runeprofile/api/client";
import { HiscoreLeaderboardKey } from "@runeprofile/runescape";

// @ts-expect-error
const api: Client = hc(import.meta.env.VITE_API_URL);

export type Profile = Awaited<ReturnType<typeof getProfile>>;

export async function getProfile(params: { username: string }) {
  const response = await api.profiles[":username"].$get({
    param: {
      username: params.username,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  return data;
}

export async function getHiscoresData(params: {
  username: string;
  leaderboard: HiscoreLeaderboardKey;
}) {
  const response = await api.hiscores[":leaderboard"][":username"].$get({
    param: {
      leaderboard: params.leaderboard,
      username: params.username,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch hiscore data");
  }

  const data = await response.json();
  return data;
}

export async function searchProfiles(params: { query: string }) {
  const repsonse = await api.profiles.$get({
    query: {
      q: params.query,
    },
  });

  if (!repsonse.ok) {
    throw new Error("Failed to fetch profiles");
  }

  const data = await repsonse.json();
  return data;
}
