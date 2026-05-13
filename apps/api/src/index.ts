import { cors } from "hono/cors";

import { clansRouter } from "~/internal/routes/clans";
import { discordRouter } from "~/internal/routes/discord";
import { groupsRouter } from "~/internal/routes/groups";
import { hiscoresRouter } from "~/internal/routes/hiscores";
import { manifestRouter } from "~/internal/routes/manifest";
import { metricsRouter } from "~/internal/routes/metrics";
import { profilesRouter } from "~/internal/routes/profiles";
import { simulateRouter } from "~/internal/routes/simulate";
import { errorHandler, logger, newRouter } from "~/lib/helpers";
import { publicApiV1 } from "~/public/v1/index";

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
  .route("/v1", publicApiV1)
  .route("/profiles", profilesRouter)
  .route("/clans", clansRouter)
  .route("/groups", groupsRouter)
  .route("/hiscores", hiscoresRouter)
  .route("/manifest", manifestRouter)
  .route("/metrics", metricsRouter)
  .route("/discord", discordRouter)
  .route("/simulate", simulateRouter);
