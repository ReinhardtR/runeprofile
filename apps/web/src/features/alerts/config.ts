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
 * Active alerts configuration.
 * Add/remove alerts here to show them on the website.
 *
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
export const ACTIVE_ALERTS: GlobalAlert[] = [];

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
