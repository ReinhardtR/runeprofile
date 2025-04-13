import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Profile } from "~/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function base64ImgSrc(image: string) {
  return `data:image/png;base64,${image}`;
}
