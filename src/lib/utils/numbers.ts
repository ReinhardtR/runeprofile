export const numberWithDelimiter = (x: number) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const numberWithAbbreviation = (x: number) => {
  if (x < 1e3) return x;
  if (x >= 1e3 && x < 1e6) return +(x / 1e3).toFixed(1) + "K";
  if (x >= 1e6 && x < 1e9) return +(x / 1e6).toFixed(1) + "M";
  if (x >= 1e9 && x < 1e12) return +(x / 1e9).toFixed(1) + "B";
};
