export const entryNameToPath = (bossName: string): string => {
  return bossName
    .replace(" - ", "_")
    .replace(/[\s-]/g, "_")
    .replace(/[':()]/g, "")
    .toLowerCase();
};
