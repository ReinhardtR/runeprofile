import { hc } from "hono/client";

import type { ApiType } from "@runeprofile/api";

export const api = hc<ApiType>(import.meta.env.VITE_API_URL);
