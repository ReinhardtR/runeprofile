import { cors } from "hono/cors";

import { newRouter } from "~/lib/helpers";
import { hiscoresRouter } from "~/routes/hiscores";
import { profilesRouter } from "~/routes/profiles";

export default newRouter()
  .use(cors())
  .use(async (c, next) => {
    await next();
    c.header("Date", new Date().toUTCString());
  })
  .route("/profiles", profilesRouter)
  .route("/hiscores", hiscoresRouter);
