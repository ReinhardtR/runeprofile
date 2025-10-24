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
import Link from "next/link";

import { DeleteDialog } from "./DeleteDialog";
import { UpdateUsernameDialog } from "./UpdateUsernameDialog";

export function ResultsTable({
  rows,
  searchQuery,
}: {
  rows: Array<{ id: string; username: string }>;
  searchQuery?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[340px]">ID</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r: { id: string; username: string }) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-[11px] break-all align-top">
              <div className="flex items-center gap-1">
                <span className="truncate max-w-[260px]" title={r.id}>
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
                  className="truncate max-w-[200px] underline decoration-dotted underline-offset-2"
                  title={r.username}
                >
                  {r.username}
                </a>
                <CopyButton value={r.username} label="username" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <UpdateUsernameDialog id={r.id} username={r.username} />
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
