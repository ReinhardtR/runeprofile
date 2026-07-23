import { ClientResponse, hc } from "hono/client";
import { z } from "zod";

import type { Client } from "@runeprofile/api/client";
import {
  type ActivityEventTypeValue,
  HiscoreLeaderboardKey,
} from "@runeprofile/runescape";

// During SSR, API calls skip HTTP entirely and go through the service
// binding to the API worker. In the browser they hit VITE_API_URL — "/api"
// in production (proxied same-origin by the /api/$ server route, no CORS)
// or a direct URL in development. The SSR branch is dead-code-eliminated
// from the client bundle.
const apiFetch: typeof fetch = async (input, init) => {
  if (import.meta.env.SSR) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.startsWith("/api")) {
      const { getWorkerEnv } = await import("~/core/worker-env");
      const env = await getWorkerEnv();
      const target = new URL(
        url.slice("/api".length) || "/",
        "https://runeprofile-api.internal",
      );
      return env.API.fetch(new Request(target, init));
    }
  }
  return fetch(input, init);
};

// @ts-expect-error
const api: Client = hc(import.meta.env.VITE_API_URL, { fetch: apiFetch });

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
  cursor?: string;
  direction?: "next" | "prev";
  limit?: number;
}) {
  const response = await api.clans[":name"].$get({
    param: {
      name: params.name,
    },
    query: {
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit?.toString(),
    },
  });
  return await getResponseData(response);
}

export async function getClanActivities(params: {
  name: string;
  cursor?: string;
  direction?: "next" | "prev";
  limit?: number;
  activityTypes?: ActivityEventTypeValue[];
}) {
  const response = await api.clans[":name"].activities.$get({
    param: {
      name: params.name,
    },
    query: {
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit?.toString(),
      activityTypes: params.activityTypes?.join(","),
    },
  });
  return await getResponseData(response);
}

export async function getProfileActivities(params: {
  username: string;
  cursor?: string;
  limit?: number;
  activityTypes?: ActivityEventTypeValue[];
}) {
  const response = await api.profiles[":username"].activities.$get({
    param: {
      username: params.username,
    },
    query: {
      cursor: params.cursor,
      limit: params.limit?.toString(),
      activityTypes: params.activityTypes?.join(","),
    },
  });
  return await getResponseData(response);
}

export async function getMetrics() {
  const response = await api.metrics.$get();
  return await getResponseData(response);
}

export type Group = Awaited<ReturnType<typeof getGroup>>;

export async function getGroup(params: { name: string }) {
  const response = await api.groups[":name"].$get({
    param: {
      name: params.name,
    },
  });
  return await getResponseData(response);
}

export async function getGroupActivities(params: {
  name: string;
  page?: number;
}) {
  const response = await api.groups[":name"].activities.$get({
    param: {
      name: params.name,
    },
    query: {
      page: String(params.page ?? 1),
    },
  });
  return await getResponseData(response);
}

export async function getBatchHiscores(params: {
  usernames: string[];
  leaderboard: HiscoreLeaderboardKey;
}) {
  const response = await api.hiscores.batch.$post({
    json: {
      usernames: params.usernames,
      leaderboard: params.leaderboard,
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
  response: ClientResponse<TData, number, "json">,
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
