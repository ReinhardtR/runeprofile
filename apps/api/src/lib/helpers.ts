import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  CORS_ORIGIN: string;
};

export const newRouter = () => new Hono<{ Bindings: Bindings }>();

export const STATUS = {
  OK: 200,
  CREATED: 201,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

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
