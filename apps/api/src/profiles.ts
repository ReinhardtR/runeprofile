import { hono } from "./hono";

export const profilesRouter = hono().get("/", (c) =>
  c.json({
    somekey: "somevalue",
  })
);
