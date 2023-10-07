import { type Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema",
  out: "./.drizzle",
  driver: "mysql2",
  verbose: true,
  dbCredentials: {
    connectionString: "",
  },
} satisfies Config;
