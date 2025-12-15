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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash, Trash2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

import {
  clearAllAccountItems,
  deleteAccountItems,
  updateItemQuantity,
} from "./actions";

type Item = {
  id: number;
  quantity: number;
  createdAt: string;
};

interface AccountItemsTableProps {
  accountId: string;
  items: Item[];
  currentPage: number;
  searchItemId?: string;
}

export function AccountItemsTable({
  accountId,
  items,
  currentPage,
  searchItemId,
}: AccountItemsTableProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
    setLastSelectedIndex(null);
  };

  const toggleSelectItem = (itemId: number, event?: React.MouseEvent) => {
    const currentIndex = items.findIndex((item) => item.id === itemId);

    if (event?.shiftKey && lastSelectedIndex !== null) {
      // Shift-click: select range
      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = items
        .slice(startIndex, endIndex + 1)
        .map((item) => item.id);

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        rangeIds.forEach((id) => newSelected.add(id));
        return Array.from(newSelected);
      });
    } else {
      // Normal click: toggle single item
      setSelectedIds((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId],
      );
    }

    setLastSelectedIndex(currentIndex);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        const result = await deleteAccountItems(accountId, selectedIds);
        toast.success(`Successfully deleted ${result.deleted} items`);
        setSelectedIds([]);

        // Refresh the page to show updated results
        const url = new URL(
          window.location.origin +
            `/accounts/${encodeURIComponent(accountId)}/items`,
        );
        url.searchParams.set("page", currentPage.toString());
        if (from) url.searchParams.set("from", from);
        if (searchItemId) url.searchParams.set("itemId", searchItemId);
        window.location.href = url.toString();
      } catch (error) {
        toast.error("Failed to delete items");
        console.error(error);
      }
    });
  };

  const handleClearAll = async () => {
    startTransition(async () => {
      try {
        await clearAllAccountItems(accountId);
        toast.success(`Successfully cleared all items`);
        setSelectedIds([]);

        // Refresh the page to show updated results
        const url = new URL(
          window.location.origin +
            `/accounts/${encodeURIComponent(accountId)}/items`,
        );
        url.searchParams.set("page", "1");
        if (from) url.searchParams.set("from", from);
        if (searchItemId) url.searchParams.set("itemId", searchItemId);
        window.location.href = url.toString();
      } catch (error) {
        toast.error("Failed to clear all items");
        console.error(error);
      }
    });
  };

  const startEditQuantity = (itemId: number, currentQuantity: number) => {
    setEditingItem(itemId);
    setEditQuantity(currentQuantity.toString());
  };

  const handleUpdateQuantity = async (itemId: number) => {
    const newQuantity = parseInt(editQuantity, 10);

    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Please enter a valid quantity (0 or greater)");
      return;
    }

    startTransition(async () => {
      try {
        await updateItemQuantity(accountId, itemId, newQuantity);
        if (newQuantity === 0) {
          toast.success("Item deleted (quantity set to 0)");
        } else {
          toast.success(`Quantity updated to ${newQuantity.toLocaleString()}`);
        }
        setEditingItem(null);

        // Refresh the page to show updated results
        const url = new URL(
          window.location.origin +
            `/accounts/${encodeURIComponent(accountId)}/items`,
        );
        url.searchParams.set("page", currentPage.toString());
        if (from) url.searchParams.set("from", from);
        if (searchItemId) url.searchParams.set("itemId", searchItemId);
        window.location.href = url.toString();
      } catch (error) {
        toast.error("Failed to update quantity");
        console.error(error);
      }
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditQuantity("");
  };

  const formatDate = (dateString: string) => {
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

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No items to display.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isPending}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedIds.length}{" "}
                      selected items? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {/* Clear All Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash className="w-4 h-4 mr-1" />
              Clear All Items
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Items</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ALL items for this account? This
                will remove {items.length} items and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                <TableHead>Quantity</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div
                      onClick={(e) => toggleSelectItem(item.id, e)}
                      className="cursor-pointer select-none p-1 rounded hover:bg-muted/50"
                      title="Click to select, Shift+click to select range"
                    >
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => {}} // Handled by div onClick
                        aria-label={`Select item ${item.id}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Image
                      src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
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
                    {COLLECTION_LOG_ITEMS[item.id] || `Unknown Item`}
                  </TableCell>
                  <TableCell>
                    {editingItem === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-20 h-8"
                          min="0"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id)}
                          disabled={isPending}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {item.quantity.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            startEditQuantity(item.id, item.quantity)
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSelectItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
