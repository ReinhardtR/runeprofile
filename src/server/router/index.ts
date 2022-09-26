import superjson from "superjson";
import { createRouter } from "./context";
import { accountsRouter } from "./accounts";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("accounts.", accountsRouter);

export type AppRouter = typeof appRouter;
