"use client";

import { CopyButton } from "@/components/copy-button";
import {
  ClearButton,
  ResolveDialog,
  formatIdle,
} from "@/components/pending-name-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isStaleHolder } from "@/lib/pending-names";
import { Ban, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { DeleteDialog } from "./DeleteDialog";
import { EditAccountDialog } from "./EditAccountDialog";
import { ResyncButton } from "./ResyncButton";

interface AccountRow {
  id: string;
  username: string;
  banned: boolean;
  clanName: string | null;
  clanRank: number | null;
  clanIcon: number | null;
  clanTitle: string | null;
  groupName: string | null;
  forceResync: boolean;
  updatedAt: string;
  pendingUsername: string | null;
  holderUsername: string | null;
  holderUpdatedAt: string | null;
}

function ConflictCell({ row }: { row: AccountRow }) {
  if (!row.pendingUsername) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const stale = isStaleHolder(row.holderUpdatedAt);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-sm">
        <TriangleAlert
          className={`h-4 w-4 ${stale ? "text-amber-600" : "text-destructive"}`}
        />
        wants{" "}
        <span className="font-mono font-medium">{row.pendingUsername}</span>
      </div>
      <div className="text-xs text-muted-foreground" suppressHydrationWarning>
        {row.holderUsername ? (
          <>
            held by{" "}
            <a
              href={`https://runeprofile.com/${encodeURIComponent(row.holderUsername)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline decoration-dotted underline-offset-2"
            >
              {row.holderUsername}
            </a>
            {row.holderUpdatedAt && ` · ${formatIdle(row.holderUpdatedAt)}`}
            {stale && " · stale"}
          </>
        ) : (
          "name is free"
        )}
      </div>
      <div className="flex items-center gap-2">
        <ResolveDialog
          row={{
            id: row.id,
            username: row.username,
            pendingUsername: row.pendingUsername,
            updatedAt: row.updatedAt,
            holderUsername: row.holderUsername,
            holderUpdatedAt: row.holderUpdatedAt,
          }}
        />
        <ClearButton row={row} />
      </div>
    </div>
  );
}

export function ResultsTable({
  rows,
  searchQuery,
}: {
  rows: AccountRow[];
  searchQuery?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">ID</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Clan</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Name Conflict</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r: AccountRow) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-[11px] break-all align-top">
              <div className="flex items-center gap-1">
                <span className="truncate max-w-[220px]" title={r.id}>
                  {r.id}
                </span>
                <CopyButton value={r.id} label="id" />
              </div>
            </TableCell>
            <TableCell className="align-top">
              <div className="flex items-center gap-1">
                <a
                  href={`https://runeprofile.com/${encodeURIComponent(r.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate max-w-[150px] underline decoration-dotted underline-offset-2"
                  title={r.username}
                >
                  {r.username}
                </a>
                {r.banned && (
                  <div title="Banned">
                    <Ban className="h-4 w-4 text-destructive" />
                  </div>
                )}
                <CopyButton value={r.username} label="username" />
              </div>
            </TableCell>
            <TableCell className="align-top">
              {r.clanName ? (
                <div className="space-y-1">
                  <div className="font-medium text-sm">{r.clanName}</div>
                  {(r.clanTitle || r.clanRank !== null) && (
                    <div className="text-xs text-muted-foreground">
                      {r.clanTitle && <span>{r.clanTitle}</span>}
                      {r.clanTitle && r.clanRank !== null && <span> • </span>}
                      {r.clanRank !== null && <span>Rank {r.clanRank}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">No clan</span>
              )}
            </TableCell>
            <TableCell className="align-top">
              <div className="text-sm">
                {r.updatedAt ? (
                  <time dateTime={r.updatedAt} suppressHydrationWarning>
                    {new Date(r.updatedAt).toLocaleString()}
                  </time>
                ) : (
                  "N/A"
                )}
              </div>
            </TableCell>
            <TableCell className="align-top">
              <ConflictCell row={r} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 flex-wrap">
                <EditAccountDialog account={r} />
                <DeleteDialog id={r.id} username={r.username} />
                <ResyncButton id={r.id} forceResync={r.forceResync} />
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/accounts/${encodeURIComponent(r.id)}/activities${searchQuery ? `?from=${encodeURIComponent(searchQuery)}` : ""}`}
                  >
                    Activities
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/accounts/${encodeURIComponent(r.id)}/items${searchQuery ? `?from=${encodeURIComponent(searchQuery)}` : ""}`}
                  >
                    Items
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
