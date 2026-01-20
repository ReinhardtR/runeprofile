import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { getActiveAlerts } from "./config";

/**
 * Persisted set of dismissed alert IDs.
 * Stored in localStorage under "dismissed-alerts".
 */
export const dismissedAlertIdsAtom = atomWithStorage<string[]>(
  "dismissed-alerts",
  [],
);

/**
 * Derived atom that returns visible alerts.
 * Filters out dismissed alerts and sorts by priority (most severe first).
 * Also cleans up stale dismissed IDs that are no longer in the config.
 */
export const visibleAlertsAtom = atom((get) => {
  const dismissedIds = get(dismissedAlertIdsAtom);
  const activeAlerts = getActiveAlerts();

  const visibleAlerts = activeAlerts.filter(
    (alert) => !dismissedIds.includes(alert.id),
  );

  return visibleAlerts;
});

/**
 * Derived atom that returns stale dismissed IDs.
 * These are IDs in localStorage that are no longer in the config.
 */
export const staleAlertIdsAtom = atom((get) => {
  const dismissedIds = get(dismissedAlertIdsAtom);
  const allConfiguredIds = getActiveAlerts().map((alert) => alert.id);
  return dismissedIds.filter((id) => !allConfiguredIds.includes(id));
});

/**
 * Write-only atom to dismiss an alert by ID.
 */
export const dismissAlertAtom = atom(null, (get, set, alertId: string) => {
  const currentDismissed = get(dismissedAlertIdsAtom);
  const allConfiguredIds = getActiveAlerts().map((alert) => alert.id);

  // Add the new dismissed ID and filter out any stale IDs
  const newDismissed = [...currentDismissed, alertId].filter((id) =>
    allConfiguredIds.includes(id),
  );

  // Deduplicate
  set(dismissedAlertIdsAtom, [...new Set(newDismissed)]);
});

/**
 * Write-only atom to clean up stale dismissed IDs.
 * Call this on app initialization to remove old IDs from localStorage.
 */
export const cleanupStaleAlertsAtom = atom(null, (get, set) => {
  const dismissedIds = get(dismissedAlertIdsAtom);
  const allConfiguredIds = getActiveAlerts().map((alert) => alert.id);

  const validIds = dismissedIds.filter((id) => allConfiguredIds.includes(id));

  if (validIds.length !== dismissedIds.length) {
    set(dismissedAlertIdsAtom, validIds);
  }
});
