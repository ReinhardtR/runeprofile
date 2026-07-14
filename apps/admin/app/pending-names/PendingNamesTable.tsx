"use client";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clearPendingName,
  type PendingNameRow,
  resolvePendingName,
} from "./actions";

function formatIdle(since: string | null): string {
  if (!since) return "";
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 31) return `${days}d idle`;
  return `${Math.floor(days / 30)}mo idle`;
}

function SyncTime({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">N/A</span>;
  return (
    <time
      dateTime={value}
      suppressHydrationWarning
      className="whitespace-nowrap"
    >
      {new Date(value).toLocaleString()}
    </time>
  );
}

function ResolveDialog({ row }: { row: PendingNameRow }) {
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
                <span className="font-mono font-bold">{row.username}</span>{" "}
                will be renamed to{" "}
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
          <Button type="button" size="sm" disabled={isLoading} onClick={handleResolve}>
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

function ClearButton({ row }: { row: PendingNameRow }) {
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

export function PendingNamesTable({ rows }: { rows: PendingNameRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claimant</TableHead>
          <TableHead>Wants</TableHead>
          <TableHead>Claimant Last Sync</TableHead>
          <TableHead>Holder</TableHead>
          <TableHead>Holder Last Sync</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <a
                href={`https://runeprofile.com/${encodeURIComponent(r.username)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 font-mono text-sm"
                title={r.username}
              >
                {r.username}
              </a>
            </TableCell>
            <TableCell className="font-mono text-sm">
              {r.pendingUsername}
            </TableCell>
            <TableCell className="text-sm">
              <SyncTime value={r.updatedAt} />
            </TableCell>
            <TableCell>
              {r.holderUsername ? (
                <a
                  href={`https://runeprofile.com/${encodeURIComponent(r.holderUsername)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 font-mono text-sm"
                  title={r.holderUsername}
                >
                  {r.holderUsername}
                </a>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-muted text-xs">
                  Name free
                </span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {r.holderUsername ? (
                <div className="space-y-0.5">
                  <SyncTime value={r.holderUpdatedAt} />
                  <div
                    className="text-xs text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatIdle(r.holderUpdatedAt)}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ResolveDialog row={r} />
                <ClearButton row={r} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
