import { OpenAPIHono } from "@hono/zod-openapi";

import type { ApiKeyContext } from "./middleware/api-key";

export type V1Env = {
  Bindings: Env;
  Variables: ApiKeyContext["Variables"];
};

export function createV1App() {
  return new OpenAPIHono<V1Env>();
}
