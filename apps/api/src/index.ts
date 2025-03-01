import { cors } from "hono/cors";
import { hono } from "./hono";
import { profilesRouter } from "./profiles";

const app = hono();

app.use(cors());

const router = app
  .get("/", (c) => c.json({ root: "route" }))
  .route("/profiles", profilesRouter);

export default app;

export type ApiType = typeof router;
