import { useAtom, useSetAtom } from "jotai";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
  X,
} from "lucide-react";
import React from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/shared/components/ui/alert";

import type { AlertType } from "./config";
import {
  cleanupStaleAlertsAtom,
  dismissAlertAtom,
  visibleAlertsAtom,
} from "./state";

const ALERT_ICONS: Record<AlertType, LucideIcon> = {
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

export const GlobalAlertBanner: React.FC = () => {
  const [visibleAlerts] = useAtom(visibleAlertsAtom);
  const dismissAlert = useSetAtom(dismissAlertAtom);
  const cleanupStaleAlerts = useSetAtom(cleanupStaleAlertsAtom);

  // Clean up stale dismissed IDs on mount
  React.useEffect(() => {
    cleanupStaleAlerts();
  }, [cleanupStaleAlerts]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-4">
      {visibleAlerts.map((alert) => {
        const Icon = ALERT_ICONS[alert.type];

        return (
          <Alert
            key={alert.id}
            variant={alert.type}
            className="relative pr-10 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <Icon className="size-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <button
              type="button"
              onClick={() => dismissAlert(alert.id)}
              className="absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Dismiss alert"
            >
              <X className="size-4" />
            </button>
          </Alert>
        );
      })}
    </div>
  );
};
