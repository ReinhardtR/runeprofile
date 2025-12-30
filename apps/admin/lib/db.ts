import { cache } from "react";

import { drizzle } from "@runeprofile/db";

export const getDb = cache(() => {
  return drizzle({ connectionString: process.env.DATABASE_URL! });
});
