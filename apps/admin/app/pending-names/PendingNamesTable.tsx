"use client";

import {
  ClearButton,
  ResolveDialog,
  formatIdle,
} from "@/components/pending-name-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PendingNameRow, isStaleHolder } from "@/lib/pending-names";

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
                    className={`text-xs ${isStaleHolder(r.holderUpdatedAt) ? "text-amber-600" : "text-muted-foreground"}`}
                    suppressHydrationWarning
                  >
                    {formatIdle(r.holderUpdatedAt)}
                    {isStaleHolder(r.holderUpdatedAt) && " · stale"}
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
