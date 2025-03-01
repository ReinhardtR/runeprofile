import { hc } from "hono/client";
import type { ApiType } from "@runeprofile/api";

export const api = hc<ApiType>("http://localhost:8787");
