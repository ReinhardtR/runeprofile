import { entriesRouter } from "./entries";
import superjson from "superjson";
import { createRouter } from "./context";
import { accountsRouter } from "./accounts";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("accounts.", accountsRouter)
  .merge("entries.", entriesRouter);

export type AppRouter = typeof appRouter;
