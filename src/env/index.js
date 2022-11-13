// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // RuneProfile Secret Token
  SECRET_TOKEN: z.string(),

  // PlanetScale
  DATABASE_URL: z.string().url(),

  // Google Cloud Storage
  GCP_PROJECT_ID: z.string(),
  GCP_CLIENT_EMAIL: z.string().email(),
  GCP_PRIVATE_KEY: z.string(),
  GCS_BUCKET_NAME: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 4)
  );
  process.exit(1);
}

module.exports.env = env.data;
