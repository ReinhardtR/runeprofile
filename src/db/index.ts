import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import { env } from "~/env.mjs";
import * as schema from "./schema";

const connection = connect({
  url: env.DATABASE_URL,
});

export const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development",
});
