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

export const dateHeaderMiddleware = createMiddleware(async (c, next) => {
  await next();
  c.header("Date", new Date().toUTCString());
});

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
