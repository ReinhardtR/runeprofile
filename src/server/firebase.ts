import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { env } from "./env";

const app = initializeApp({
  apiKey: env.FIREBASE_API_KEY,
  projectId: env.FIREBASE_PROJECT_ID,
  appId: env.FIREBASE_APP_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
});

const storage = getStorage(app);

export const uploadByteArray = async ({
  path,
  byteArray,
}: {
  path: string;
  byteArray: Uint8Array;
}) => {
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, byteArray);

  return getDownloadURL(storageRef);
};
