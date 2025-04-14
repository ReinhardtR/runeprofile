import { cors } from "hono/cors";

import { newRouter } from "~/lib/helpers";
import { hiscoresRouter } from "~/routes/hiscores";
import { profilesRouter } from "~/routes/profiles";

export default newRouter()
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
  .use(async (c, next) => {
    await next();
    c.header("Date", new Date().toUTCString());
  })
  .route("/profiles", profilesRouter)
  .route("/hiscores", hiscoresRouter);
