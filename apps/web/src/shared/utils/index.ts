import { BufferGeometry } from "three";
// @ts-expect-error
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import { Profile } from "~/core/api";
import COLLECTION_LOG_RANK_ICONS from "~/core/assets/collection-log-rank-icons.json";

export { cn } from "./cn";

export function numberWithDelimiter(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function numberWithAbbreviation(x: number) {
  if (x < 1e3) return x;
  if (x >= 1e3 && x < 1e6) return +(x / 1e3).toFixed(1) + "K";
  if (x >= 1e6 && x < 1e9) return +(x / 1e6).toFixed(1) + "M";
  if (x >= 1e9 && x < 1e12) return +(x / 1e9).toFixed(1) + "B";
}

export function formatDate(date: string | Date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getSkillXp(skills: Profile["skills"], skill: string) {
  return skills.find((s) => s.name === skill)?.xp || 0;
}

export function getCollectionLogRankIcon(uniqueItemsObtained: number) {
  let rank = "";
  if (uniqueItemsObtained >= 1400) {
    rank = "gilded";
  } else if (uniqueItemsObtained >= 1200) {
    rank = "dragon";
  } else if (uniqueItemsObtained >= 1100) {
    rank = "rune";
  } else if (uniqueItemsObtained >= 1000) {
    rank = "adamant";
  } else if (uniqueItemsObtained >= 900) {
    rank = "mithril";
  } else if (uniqueItemsObtained >= 700) {
    rank = "black";
  } else if (uniqueItemsObtained >= 500) {
    rank = "steel";
  } else if (uniqueItemsObtained >= 300) {
    rank = "iron";
  } else {
    rank = "bronze";
  }
  return base64ImgSrc(
    COLLECTION_LOG_RANK_ICONS[rank as keyof typeof COLLECTION_LOG_RANK_ICONS],
  );
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const itemIconUrl = (itemId: number) =>
  `https://static.runelite.net/cache/item/icon/${itemId}.png`;

export function base64ImgSrc(image: string) {
  return `data:image/png;base64,${image}`;
}

export function loadModelFromBase64(base64: string): Promise<BufferGeometry> {
  const loader = new PLYLoader();

  const tryLoad = (base64: string) => {
    const arrayBuffer = base64ToArrayBuffer(base64);
    return loader.parse(arrayBuffer);
  };

  return new Promise((resolve, reject) => {
    try {
      const geometry = tryLoad(base64);
      resolve(geometry);
    } catch (error) {
      console.error("Error loading model:", error);
      reject(error);
    }
  });
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
