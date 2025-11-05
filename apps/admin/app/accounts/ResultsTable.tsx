"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ban } from "lucide-react";
import Link from "next/link";

import { DeleteDialog } from "./DeleteDialog";
import { EditAccountDialog } from "./EditAccountDialog";

interface AccountRow {
  id: string;
  username: string;
  banned: boolean;
  clanName: string | null;
  clanRank: number | null;
  clanIcon: number | null;
  clanTitle: string | null;
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
            <TableCell>
              <div className="flex items-center gap-2 flex-wrap">
                <EditAccountDialog account={r} />
                <DeleteDialog id={r.id} username={r.username} />
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
