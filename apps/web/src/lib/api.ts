import { ClientResponse, hc } from "hono/client";
import { z } from "zod";

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
  return await getResponseData(response);
}

export async function getProfileModels(params: {
  username: string;
  includePet: boolean;
}) {
  const response = await api.profiles.models[":username"].$get({
    param: {
      username: params.username,
    },
    query: {
      pet: String(params.includePet),
    },
  });
  return await getResponseData(response);
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
  return await getResponseData(response);
}

export async function searchProfiles(params: { query: string }) {
  const response = await api.profiles.$get({
    query: {
      q: params.query,
    },
  });
  return await getResponseData(response);
}

export async function getClanMembers(params: {
  name: string;
  page?: number;
  query?: string;
}) {
  const response = await api.clans[":name"].$get({
    param: {
      name: params.name,
    },
    query: {
      page: String(params.page),
      query: params.query,
    },
  });
  return await getResponseData(response);
}

export class RuneProfileApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RuneProfileApiError";
    this.code = code;
  }
}

const RuneProfileApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

async function getResponseData<TData>(
  response: ClientResponse<TData>,
): Promise<TData> {
  const unexpectedError = new RuneProfileApiError(
    "UnexpectedError",
    "Something unexpected went wrong",
  );

  const data = await response.json().catch(() => {
    throw unexpectedError;
  });

  if (response.ok) return data as TData;

  const parsedError = RuneProfileApiErrorSchema.safeParse(data);

  throw parsedError.success
    ? new RuneProfileApiError(parsedError.data.code, parsedError.data.message)
    : unexpectedError;
}
