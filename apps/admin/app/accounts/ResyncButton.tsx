"use client";

import { toggleForceResync } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export function ResyncButton({
  id,
  forceResync,
}: {
  id: string;
  forceResync: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(forceResync);

  const handleClick = async () => {
    setPending(true);
    try {
      const result = await toggleForceResync(id);
      setActive(result.forceResync);
    } catch (err) {
      console.error("Failed to toggle resync:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={handleClick}
      disabled={pending}
      title={
        active
          ? "Resync is queued — next profile update will force-sync all data"
          : "Queue a forced resync for the next profile update"
      }
    >
      {pending ? (
        <LoaderCircle className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3 mr-1" />
      )}
      {active ? "Resync Queued" : "Resync"}
    </Button>
  );
}
