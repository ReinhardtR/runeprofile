import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 13);

export const generatePath = () => {
  return nanoid();
};
