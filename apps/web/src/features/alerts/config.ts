export type AlertType = "info" | "warning" | "destructive" | "success";

export interface GlobalAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  startDate: string;
  endDate: string;
}

/**
 * Example:
 * {
 *   id: "maintenance-2026-01",
 *   type: "warning",
 *   title: "Scheduled Maintenance",
 *   message: "The site will be undergoing maintenance on January 20th from 2-4 AM UTC.",
 *   startDate: "2026-01-18",
 *   endDate: "2026-01-21",
 * }
 */
export const ACTIVE_ALERTS: GlobalAlert[] = [
  // {
  //   id: "combat-achievement-tracking-2026-05",
  //   type: "info",
  //   title: "Improved Combat Achievement Tracking",
  //   message:
  //     "RuneProfile now tracks all combat achievement tasks individually, and calculates your tier based on points. Click the CA tab on a profile to see all tasks.",
  //   startDate: "2026-05-14",
  //   endDate: "2026-05-28",
  // },
  {
    id: "plugin-broken-2026-05",
    type: "info",
    title: "RuneLite Plugin Issue",
    message:
      "Updating your profile through the collection log is currently broken. Working on a fix.",
    startDate: "2026-05-10",
    endDate: "2026-05-24",
  },
];

export function getActiveAlerts(): GlobalAlert[] {
  const now = new Date();

  return ACTIVE_ALERTS.filter((alert) => {
    const startDate = new Date(alert.startDate);
    const endDate = new Date(alert.endDate);
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;
  });
}
