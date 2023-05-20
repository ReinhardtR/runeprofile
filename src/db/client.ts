import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Database } from "~/db/generated/database-types";
import { env } from "~/env/index.mjs";

export const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    url: env.DATABASE_URL,
  }),
});
