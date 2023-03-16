import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Database } from "~/db/database-types";
import { env } from "~/env";

export const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    url: env.DATABASE_URL,
    fetch: (url, options) => fetch(url, options),
  }),
});
