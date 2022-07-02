export const getKillCountParts = (killCount: string) => {
  const parts = killCount.split(": ");

  const name = parts[0];
  const amount = Number(parts[1]);

  return [name, amount] as [string, number];
};
