"use client";

import {
  type ResolveStaleResult,
  clearPendingName,
  resolvePendingName,
  resolveStalePendingNames,
} from "@/app/pending-names/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type PendingNameRow, STALE_HOLDER_DAYS } from "@/lib/pending-names";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function formatIdle(since: string | null): string {
  if (!since) return "";
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 31) return `${days}d idle`;
  return `${Math.floor(days / 30)}mo idle`;
}

export function ResolveDialog({ row }: { row: PendingNameRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResolve = async () => {
    setIsLoading(true);
    setError("");
    try {
      await resolvePendingName(row.id);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant pending name</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                <span className="font-mono font-bold">{row.username}</span> will
                be renamed to{" "}
                <span className="font-mono font-bold">
                  {row.pendingUsername}
                </span>
                .
              </p>
              {row.holderUsername ? (
                <p>
                  The current holder{" "}
                  <span className="font-mono font-bold">
                    {row.holderUsername}
                  </span>{" "}
                  (last sync{" "}
                  {row.holderUpdatedAt
                    ? new Date(row.holderUpdatedAt).toLocaleString()
                    : "unknown"}
                  ) will be archived under a placeholder.
                </p>
              ) : (
                <p>The name is free — no other account is affected.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={handleResolve}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="animate-spin h-4 w-4" />
                Resolving...
              </span>
            ) : (
              "Resolve"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClearButton({ row }: { row: Pick<PendingNameRow, "id"> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          await clearPendingName(row.id);
          router.refresh();
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? <LoaderCircle className="animate-spin h-4 w-4" /> : "Clear"}
    </Button>
  );
}

/**
 * Resolves every claim whose holder is idle for STALE_HOLDER_DAYS+. Runs in
 * batches; the dialog stays open with a summary until the admin closes it.
 */
export function ResolveStaleDialog({ staleCount }: { staleCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResolveStaleResult | null>(null);

  const handleRun = async () => {
    setIsLoading(true);
    setError("");
    try {
      const next = await resolveStalePendingNames();
      setResult((prev) =>
        prev
          ? {
              resolved: [...prev.resolved, ...next.resolved],
              failed: [...prev.failed, ...next.failed],
              remaining: next.remaining,
            }
          : next,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isLoading) return;
    setOpen(value);
    if (!value) {
      setResult(null);
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" disabled={staleCount === 0}>
          Resolve stale ({staleCount})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve stale pending names</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Grants every pending name whose current holder has not synced
                for {STALE_HOLDER_DAYS}+ days. Each holder is archived under a
                placeholder. Claims on free names and on recently active holders
                are left alone.
              </p>
              <p>
                <span className="font-medium">{staleCount}</span> claim
                {staleCount === 1 ? "" : "s"} qualify right now.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        {result && (
          <div className="space-y-2 text-sm">
            <p>
              Resolved{" "}
              <span className="font-medium">{result.resolved.length}</span>
              {result.failed.length > 0 && (
                <>
                  , failed{" "}
                  <span className="font-medium text-destructive">
                    {result.failed.length}
                  </span>
                </>
              )}
              {result.remaining > 0 && (
                <>
                  , <span className="font-medium">{result.remaining}</span>{" "}
                  still waiting
                </>
              )}
              .
            </p>
            {result.resolved.length > 0 && (
              <ul className="max-h-40 overflow-y-auto font-mono text-xs space-y-0.5">
                {result.resolved.map((r) => (
                  <li key={`${r.username}->${r.pendingUsername}`}>
                    {r.username} → {r.pendingUsername}
                  </li>
                ))}
              </ul>
            )}
            {result.failed.length > 0 && (
              <ul className="max-h-40 overflow-y-auto text-xs space-y-0.5 text-destructive">
                {result.failed.map((f) => (
                  <li key={`${f.username}->${f.pendingUsername}`}>
                    <span className="font-mono">
                      {f.username} → {f.pendingUsername}
                    </span>
                    : {f.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              {result ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          {(!result || result.remaining > 0) && (
            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={handleRun}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="animate-spin h-4 w-4" />
                  Resolving...
                </span>
              ) : result ? (
                `Resolve next ${Math.min(result.remaining, 25)}`
              ) : (
                "Resolve all stale"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
