export const formatXP = (xp: number) => {
  if (xp < 1000) return xp.toString();

  if (xp < 1000000) return (xp / 1000).toFixed(0) + "K";

  return (xp / 1000000).toFixed(0) + "M";
};
