import { ErrorHandler, Hono } from "hono";
import { createMiddleware } from "hono/factory";

import { RuneProfileError } from "~/lib/errors";
import { STATUS } from "~/lib/status";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  CORS_ORIGIN: string;
};

export const newRouter = () => new Hono<{ Bindings: Bindings }>();

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
