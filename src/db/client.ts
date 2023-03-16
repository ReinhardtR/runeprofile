import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Database } from "~/db/database-types";

export const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    url: process.env.DATABASE_URL,
    fetch: (url, options) => fetch(url, options),
  }),
});
