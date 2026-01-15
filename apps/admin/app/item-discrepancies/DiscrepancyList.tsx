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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AccountItemDiscrepancy,
  AccountItemDiscrepancyWithDetails,
} from "@/types/item-discrepancies";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  dismissDiscrepancy,
  getDiscrepancyDetails,
  reconcileDiscrepancy,
} from "./actions";

interface DiscrepancyListProps {
  initialDiscrepancies: AccountItemDiscrepancy[];
}

export function DiscrepancyList({
  initialDiscrepancies,
}: DiscrepancyListProps) {
  const router = useRouter();
  const [discrepancies, setDiscrepancies] = useState(initialDiscrepancies);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [details, setDetails] =
    useState<AccountItemDiscrepancyWithDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmReconcileOpen, setConfirmReconcileOpen] = useState(false);
  const [confirmDismissOpen, setConfirmDismissOpen] = useState(false);

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

  const loadDetails = useCallback(async (accountId: string) => {
    setIsLoadingDetails(true);
    try {
      const data = await getDiscrepancyDetails(accountId);
      setDetails(data);
    } catch (error) {
      toast.error("Failed to load discrepancy details");
      console.error(error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const openDiscrepancy = useCallback(
    (accountId: string) => {
      setSelectedAccountId(accountId);
      loadDetails(accountId);
    },
    [loadDetails],
  );

  const closeDialog = () => {
    setSelectedAccountId(null);
    setDetails(null);
  };

  const openNextDiscrepancy = useCallback(() => {
    if (!selectedAccountId) return;

    const currentIndex = discrepancies.findIndex(
      (d) => d.accountId === selectedAccountId,
    );
    // After removing current, the next one will be at the same index
    const remainingDiscrepancies = discrepancies.filter(
      (d) => d.accountId !== selectedAccountId,
    );

    if (remainingDiscrepancies.length > 0) {
      // Open the item that's now at the same position (or last if we were at end)
      const nextIndex = Math.min(currentIndex, remainingDiscrepancies.length - 1);
      const nextDiscrepancy = remainingDiscrepancies[nextIndex];
      setDiscrepancies(remainingDiscrepancies);
      openDiscrepancy(nextDiscrepancy.accountId);
    } else {
      setDiscrepancies([]);
      closeDialog();
    }
  }, [selectedAccountId, discrepancies, openDiscrepancy]);

  const handleReconcile = async () => {
    if (!selectedAccountId || !details) return;

    startTransition(async () => {
      try {
        const result = await reconcileDiscrepancy(selectedAccountId);
        setConfirmReconcileOpen(false);
        toast.success(
          `Reconciled ${details.username}: ${result.itemsDeleted} items deleted, ${result.itemsUpdated} updated, ${result.activitiesDeleted} activities removed`,
        );
        openNextDiscrepancy();
        router.refresh();
      } catch (error) {
        toast.error("Failed to reconcile discrepancy");
        console.error(error);
      }
    });
  };

  const handleDismiss = async () => {
    if (!selectedAccountId || !details) return;

    startTransition(async () => {
      try {
        await dismissDiscrepancy(selectedAccountId);
        setConfirmDismissOpen(false);
        toast.success(`Dismissed discrepancy for ${details.username}`);
        openNextDiscrepancy();
        router.refresh();
      } catch (error) {
        toast.error("Failed to dismiss discrepancy");
        console.error(error);
      }
    });
  };

  const selectedDiscrepancy = discrepancies.find(
    (d) => d.accountId === selectedAccountId,
  );

  const itemsToRemove = details?.items.filter((i) => i.realQuantity === 0) ?? [];
  const itemsToUpdate = details?.items.filter((i) => i.realQuantity > 0) ?? [];

  return (
    <>
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
              <TableHead>To Remove / Update</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discrepancies.map((d) => {
              const toRemove = d.items.filter(
                (i) => i.realQuantity === 0,
              ).length;
              const toUpdate = d.items.filter(
                (i) => i.realQuantity > 0,
              ).length;

              return (
                <TableRow key={d.accountId}>
                  <TableCell className="font-medium">{d.username}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{d.items.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600">{toRemove}</span>
                    {" / "}
                    <span className="text-yellow-600">{toUpdate}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(d.detectedAt)}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDiscrepancy(d.accountId)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://runeprofile.com/${encodeURIComponent(d.username)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedAccountId} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              {selectedDiscrepancy?.username}&apos;s Discrepancies
            </DialogTitle>
            <DialogDescription>
              {details?.items.length ?? 0} discrepant items found
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : details ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-sm border rounded-lg p-3">
                <div>
                  <span className="text-muted-foreground block">To Remove</span>
                  <span className="text-red-600 font-bold text-lg">
                    {itemsToRemove.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">To Update</span>
                  <span className="text-yellow-600 font-bold text-lg">
                    {itemsToUpdate.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Activities to Delete
                  </span>
                  <span className="font-bold text-lg">
                    {itemsToRemove.filter((i) => i.activityId).length}
                  </span>
                </div>
              </div>

              {/* Items list - compact */}
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {details.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 p-2 text-sm"
                  >
                    <Image
                      src={`https://chisel.weirdgloop.org/static/img/osrs-dii/${item.itemId}.png`}
                      alt={item.itemName}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="flex-1 truncate">{item.itemName}</span>
                    {item.realQuantity === 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        Remove
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-yellow-600">
                        {item.storedQuantity} → {item.realQuantity}
                      </Badge>
                    )}
                    {item.activityId && (
                      <Badge variant="secondary" className="text-xs">
                        +activity
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setConfirmReconcileOpen(true)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Reconcile All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDismissOpen(true)}
                    disabled={isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://runeprofile.com/${encodeURIComponent(details.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Profile
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No details available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Reconcile Dialog */}
      <AlertDialog
        open={confirmReconcileOpen}
        onOpenChange={setConfirmReconcileOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconcile Discrepancies</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This will:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Delete {itemsToRemove.length} items</li>
                  <li>Update {itemsToUpdate.length} item quantities</li>
                  <li>
                    Remove {itemsToRemove.filter((i) => i.activityId).length}{" "}
                    activities
                  </li>
                </ul>
                <p className="mt-3">This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReconcile} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Reconcile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dismiss Dialog */}
      <AlertDialog open={confirmDismissOpen} onOpenChange={setConfirmDismissOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Discrepancy</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the discrepancy record without making any changes
              to the database. Use this if you believe the data is correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
