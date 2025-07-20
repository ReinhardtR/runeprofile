import { cors } from "hono/cors";

import { errorHandler, logger, newRouter } from "~/lib/helpers";
import { clansRouter } from "~/routes/clans";
import { hiscoresRouter } from "~/routes/hiscores";
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
      allowMethods: ["POST", "GET", "OPTIONS"],
    }),
  )
  .use(logger)
  .route("/profiles", profilesRouter)
  .route("/clans", clansRouter)
  .route("/hiscores", hiscoresRouter)
  .route("/metrics", metricsRouter);
