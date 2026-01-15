"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemDiscrepancyWithDetails } from "@/types/item-discrepancies";
import { Check, RefreshCw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  dismissDiscrepancy,
  reconcileDiscrepancy,
  removeDiscrepantItems,
} from "../actions";

interface DiscrepancyItemsTableProps {
  accountId: string;
  username: string;
  items: ItemDiscrepancyWithDetails[];
}

export function DiscrepancyItemsTable({
  accountId,
  items,
}: DiscrepancyItemsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [removeSelectedDialogOpen, setRemoveSelectedDialogOpen] =
    useState(false);

  const itemsToRemove = items.filter((i) => i.realQuantity === 0);
  const itemsToUpdate = items.filter((i) => i.realQuantity > 0);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.itemId));
    }
    setLastSelectedIndex(null);
  };

  const toggleSelectItem = (itemId: number, event?: React.MouseEvent) => {
    const currentIndex = items.findIndex((item) => item.itemId === itemId);

    if (event?.shiftKey && lastSelectedIndex !== null) {
      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = items
        .slice(startIndex, endIndex + 1)
        .map((item) => item.itemId);

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        rangeIds.forEach((id) => newSelected.add(id));
        return Array.from(newSelected);
      });
    } else {
      setSelectedIds((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId],
      );
    }

    setLastSelectedIndex(currentIndex);
  };

  const handleReconcileAll = async () => {
    startTransition(async () => {
      try {
        const result = await reconcileDiscrepancy(accountId);
        setReconcileDialogOpen(false);
        toast.success(
          `Reconciled: ${result.itemsDeleted} items deleted, ${result.itemsUpdated} items updated, ${result.activitiesDeleted} activities removed`,
        );
        router.push("/item-discrepancies");
      } catch (error) {
        toast.error("Failed to reconcile discrepancy");
        console.error(error);
      }
    });
  };

  const handleDismiss = async () => {
    startTransition(async () => {
      try {
        await dismissDiscrepancy(accountId);
        setDismissDialogOpen(false);
        toast.success("Discrepancy dismissed");
        router.push("/item-discrepancies");
      } catch (error) {
        toast.error("Failed to dismiss discrepancy");
        console.error(error);
      }
    });
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        const result = await removeDiscrepantItems(accountId, selectedIds);
        setRemoveSelectedDialogOpen(false);
        toast.success(
          `Removed ${result.itemsDeleted} items and ${result.activitiesDeleted} activities`,
        );
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        toast.error("Failed to remove items");
        console.error(error);
      }
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertDialog
              open={reconcileDialogOpen}
              onOpenChange={setReconcileDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="default" disabled={isPending}>
                  <Check className="w-4 h-4 mr-1" />
                  Reconcile All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reconcile All Discrepancies
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      This will:
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>
                          Delete {itemsToRemove.length} items that
                          shouldn&apos;t exist
                        </li>
                        <li>
                          Update quantities for {itemsToUpdate.length} items
                        </li>
                        <li>
                          Remove{" "}
                          {itemsToRemove.filter((i) => i.activityId).length}{" "}
                          associated &quot;new item obtained&quot; activities
                        </li>
                      </ul>
                      <p className="mt-3">This action cannot be undone.</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReconcileAll}>
                    Reconcile All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {selectedIds.length > 0 && (
              <AlertDialog
                open={removeSelectedDialogOpen}
                onOpenChange={setRemoveSelectedDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isPending}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove {selectedIds.length} Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Selected Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {selectedIds.length}{" "}
                      selected items from the database? This will also delete
                      any associated &quot;new item obtained&quot; activities.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove Items
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <AlertDialog
            open={dismissDialogOpen}
            onOpenChange={setDismissDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                <X className="w-4 h-4 mr-1" />
                Dismiss (No Action)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dismiss Discrepancy</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the discrepancy record without making any
                  changes to the database. Use this if you believe the current
                  data is correct and the discrepancy was a false positive.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDismiss}>
                  Dismiss
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-600">
            To Remove
          </Badge>
          <span>Item doesn&apos;t exist in real data (quantity = 0)</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
            To Update
          </Badge>
          <span>Quantity is higher in database than real data</span>
        </div>
      </div>

      {/* Items table */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Hold Shift and click to select a range of items
        </p>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      items.length > 0 && selectedIds.length === items.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Real Qty</TableHead>
                <TableHead>Stored Qty</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-24">Item ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isRemoval = item.realQuantity === 0;
                const difference = item.storedQuantity - item.realQuantity;

                return (
                  <TableRow
                    key={item.itemId}
                    className={isRemoval ? "bg-red-50/50" : "bg-yellow-50/50"}
                  >
                    <TableCell>
                      <div
                        onClick={(e) => toggleSelectItem(item.itemId, e)}
                        className="cursor-pointer select-none p-1 rounded hover:bg-muted/50"
                        title="Click to select, Shift+click to select range"
                      >
                        <Checkbox
                          checked={selectedIds.includes(item.itemId)}
                          onCheckedChange={() => {}}
                          aria-label={`Select item ${item.itemId}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Image
                        src={`https://static.runelite.net/cache/item/icon/${item.itemId}.png`}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.realQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.storedQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-destructive">
                      +{difference.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {isRemoval ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-600"
                        >
                          Remove
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-600"
                        >
                          Update
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.activityId ? (
                        <div className="text-xs">
                          <Badge variant="secondary" className="mb-1">
                            Has Activity
                          </Badge>
                          <div className="text-muted-foreground">
                            {formatDate(item.activityCreatedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.itemId}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
