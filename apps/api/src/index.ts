import { cors } from "hono/cors";

import { dateHeaderMiddleware, errorHandler, newRouter } from "~/lib/helpers";
import { hiscoresRouter } from "~/routes/hiscores";
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
  .use(dateHeaderMiddleware) // TODO: remove when runelite updates plugin to v2.0.3
  .route("/profiles", profilesRouter)
  .route("/hiscores", hiscoresRouter);
