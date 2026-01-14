import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";

import { getAllDiscrepancies } from "./actions";

export default async function ItemDiscrepanciesPage() {
  const discrepancies = await getAllDiscrepancies();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Item Discrepancies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Accounts with items in the database that don&apos;t match the real
            data from the plugin
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {discrepancies.length} accounts
        </Badge>
      </div>

      <Card className="p-4">
        {discrepancies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No discrepancies found</p>
            <p className="text-sm">
              All accounts have consistent item data between the database and
              plugin updates.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Discrepant Items</TableHead>
                <TableHead>Items to Remove</TableHead>
                <TableHead>Items to Update</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Input / Stored</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discrepancies.map((d) => {
                const itemsToRemove = d.items.filter(
                  (i) => i.realQuantity === 0,
                ).length;
                const itemsToUpdate = d.items.filter(
                  (i) => i.realQuantity > 0,
                ).length;

                return (
                  <TableRow key={d.accountId}>
                    <TableCell className="font-medium">{d.username}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{d.items.length}</Badge>
                    </TableCell>
                    <TableCell>
                      {itemsToRemove > 0 && (
                        <Badge variant="outline" className="text-red-600">
                          {itemsToRemove} to remove
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {itemsToUpdate > 0 && (
                        <Badge variant="outline" className="text-yellow-600">
                          {itemsToUpdate} to update
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(d.detectedAt)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {d.inputItemCount} / {d.storedItemCount}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/item-discrepancies/${encodeURIComponent(d.accountId)}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
