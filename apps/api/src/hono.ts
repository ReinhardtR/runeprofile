import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

export const hono = () => new Hono<{ Bindings: Bindings }>();
