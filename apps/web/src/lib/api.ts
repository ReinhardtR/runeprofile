import { apiClient } from "@runeprofile/api/client";

const api = apiClient(import.meta.env.VITE_API_URL);

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

  return { fetched: new Date(), ...data };
}
