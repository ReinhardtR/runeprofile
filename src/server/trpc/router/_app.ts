import { router } from "../trpc";
import { accountsRouter } from "./accounts";
import { entriesRouter } from "./entries";
import { leaderboardsRouter } from "./leaderboards";

export const appRouter = router({
  accounts: accountsRouter,
  entries: entriesRouter,
  leaderboards: leaderboardsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
