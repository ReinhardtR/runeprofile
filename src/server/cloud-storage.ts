import { Storage } from "@google-cloud/storage";
import { env } from "./env";

const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
  credentials: {
    client_email: env.GCP_CLIENT_EMAIL,
    private_key: env.GCP_PRIVATE_KEY,
  },
});

const bucket = storage.bucket(env.GCS_BUCKET_NAME);

export const uploadModel = async ({
  path,
  buffer,
}: {
  path: string;
  buffer: Buffer;
}) => {
  const file = bucket.file(path);

  await file.save(buffer);

  console.log(file);

  return `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/${path}`;
};
