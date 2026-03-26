import { ErrorHandler, Hono } from "hono";
import { createMiddleware } from "hono/factory";

import { RuneProfileError } from "~/lib/errors";
import { STATUS } from "~/lib/status";

export const newRouter = () => new Hono<{ Bindings: Env }>();

export async function r2FileToBase64(file: R2ObjectBody) {
  const arrayBuffer = await file.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );
  return base64String;
}

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err);
  if (err instanceof RuneProfileError) {
    return c.json({ code: err.code, message: err.message }, err.status);
  }
  return c.json(
    { code: "UnexpectedError", message: "Something unexpected went wrong." },
    STATUS.INTERNAL_SERVER_ERROR,
  );
};

export const logger = createMiddleware(async (c, next) => {
  console.log({ UserAgent: c.req.header("User-Agent") });
  await next();
});

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export const getPaginationValues = (params?: PaginationParams) => {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 10);
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
};

export type CursorFields = Record<string, string>;

export function encodeCursor(fields: CursorFields): string {
  const entries = Object.entries(fields)
    .map(([key, value]) => {
      const shortKey = cursorKeyMap[key] ?? key;
      return `${shortKey}-${encodeCursorValue(key, value)}`;
    })
    .join("_");

  return entries;
}

export function decodeCursor(
  cursor: string | undefined,
): CursorFields | undefined {
  if (!cursor) return undefined;
  return decodeCursorPayload(cursor);
}

const cursorKeyMap: Record<string, string> = {
  clanRank: "r",
  username: "u",
  createdAt: "t",
  id: "i",
};

const cursorKeyMapReverse: Record<string, string> = Object.fromEntries(
  Object.entries(cursorKeyMap).map(([key, shortKey]) => [shortKey, key]),
);

function encodeCursorValue(key: string, value: string) {
  if (key === "id") {
    return uuidToBase62(value);
  }

  if (key === "clanRank") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed.toString(36);
  }

  if (key === "createdAt") {
    const epochMs = Date.parse(value);
    return Number.isNaN(epochMs) ? value : epochMs.toString(36);
  }

  return value;
}

function decodeCursorValue(key: string, value: string) {
  if (key === "id") {
    return base62ToUuid(value);
  }

  if (key === "clanRank") {
    const parsed = Number.parseInt(value, 36);
    return Number.isNaN(parsed) ? value : String(parsed);
  }

  if (key === "createdAt") {
    const epochMs = Number.parseInt(value, 36);
    if (!Number.isNaN(epochMs)) {
      return new Date(epochMs).toISOString();
    }
  }

  return value;
}

function decodeCursorPayload(payload: string): CursorFields | undefined {
  if (!payload) return undefined;
  // Fields are separated by "_", key-value by "-" (split on first "-" only)
  const entries = payload.split("_");
  const fields: CursorFields = {};

  for (const entry of entries) {
    if (!entry) continue;
    const dashIdx = entry.indexOf("-");
    if (dashIdx === -1) continue;
    const rawKey = entry.slice(0, dashIdx);
    const rawValue = entry.slice(dashIdx + 1);
    if (!rawKey) continue;

    const key = cursorKeyMapReverse[rawKey] ?? rawKey;
    fields[key] = decodeCursorValue(key, rawValue);
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function uuidToBase62(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  let num = BigInt("0x" + hex);
  let result = "";
  while (num > 0n) {
    result = BASE62[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result.padStart(22, "0");
}

function base62ToUuid(b62: string): string {
  let num = 0n;
  for (const c of b62) {
    num = num * 62n + BigInt(BASE62.indexOf(c));
  }
  const hex = num.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type CursorPaginationParams = {
  cursor?: string;
  direction?: "next" | "prev";
  limit?: number;
};

export const getCursorPaginationValues = (params?: CursorPaginationParams) => {
  const limit = Math.max(1, Math.min(100, params?.limit || 10));
  const direction = params?.direction || "next";
  const cursor = params?.cursor ? decodeCursor(params.cursor) : undefined;

  return { cursor, direction, limit };
};
