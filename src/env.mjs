import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {},
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),

    // RuneProfile Secret Token
    SECRET_TOKEN: z.string(),

    // Turso
    TURSO_CONNECTION_URL: z.string().url(),
    TURSO_AUTH_TOKEN: z.string(),

    // Google Cloud Storage
    GCP_PROJECT_ID: z.string(),
    GCP_CLIENT_EMAIL: z.string().email(),
    GCP_PRIVATE_KEY: z.string(),
    GCS_BUCKET_NAME: z.string(),

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    // RuneProfile Secret Token
    SECRET_TOKEN: process.env.SECRET_TOKEN,

    // Turos
    TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,

    // Google Cloud Storage
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_CLIENT_EMAIL: process.env.GCP_CLIENT_EMAIL,
    GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
});
