export const CHANGE_LOG_CONFIG = {
  // the date of the last change log
  lastDate: new Date("2023-01-26"),
  // how old a change log has to be to be considered "old"
  oldThreshold: 1000 * 60 * 60 * 24 * 14,
} as const;

export const isChangeLogNew = (date: Date) => {
  return Date.now() - date.getTime() < CHANGE_LOG_CONFIG.oldThreshold;
};
