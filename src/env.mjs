import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
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
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_CLIENT_EMAIL: process.env.GCP_CLIENT_EMAIL,
    GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,
  },
});
