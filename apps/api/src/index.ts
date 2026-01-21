import { cors } from "hono/cors";

import { errorHandler, logger, newRouter } from "~/lib/helpers";
import { clansRouter } from "~/routes/clans";
import { discordRouter } from "~/routes/discord";
import { groupsRouter } from "~/routes/groups";
import { hiscoresRouter } from "~/routes/hiscores";
import { manifestRouter } from "~/routes/manifest";
import { metricsRouter } from "~/routes/metrics";
import { profilesRouter } from "~/routes/profiles";

export default newRouter()
  .onError(errorHandler)
  .use(
    "*",
    cors({
      origin: [
        "https://runeprofile.com",
        "https://www.runeprofile.com",
        "https://runeprofile.pages.dev",
        "http://localhost:3001",
      ],
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    }),
  )
  .use(logger)
  .route("/profiles", profilesRouter)
  .route("/clans", clansRouter)
  .route("/groups", groupsRouter)
  .route("/hiscores", hiscoresRouter)
  .route("/manifest", manifestRouter)
  .route("/metrics", metricsRouter)
  .route("/discord", discordRouter);
