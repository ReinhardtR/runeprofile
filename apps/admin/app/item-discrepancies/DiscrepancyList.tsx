"use client";

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
  Pause,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  dismissDiscrepancy,
  getAllDiscrepancies,
  getDetailsAndMaybeReconcile,
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

  // Auto-mode state
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoModeStatus, setAutoModeStatus] = useState<string>("");
  const [autoModeInterrupted, setAutoModeInterrupted] = useState(false);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const autoModeRef = useRef(false);
  const processingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    autoModeRef.current = isAutoMode;
  }, [isAutoMode]);

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

  // Auto-mode processor
  const processAutoMode = useCallback(async () => {
    if (processingRef.current || !autoModeRef.current) return;
    if (discrepancies.length === 0) {
      // Try to fetch the next batch
      setAutoModeStatus("Fetching next batch...");
      setIsFetchingBatch(true);
      try {
        const nextBatch = await getAllDiscrepancies();
        if (nextBatch.length === 0) {
          setIsAutoMode(false);
          setAutoModeStatus("Completed - no more discrepancies in KV");
          toast.success("All discrepancies have been processed!");
        } else {
          setDiscrepancies(nextBatch);
          setAutoModeStatus(`Fetched ${nextBatch.length} more accounts, continuing...`);
          toast.info(`Fetched ${nextBatch.length} more discrepancies`);
        }
      } catch (error) {
        setIsAutoMode(false);
        setAutoModeStatus("Error fetching next batch");
        toast.error("Failed to fetch next batch");
      } finally {
        setIsFetchingBatch(false);
      }
      return;
    }

    processingRef.current = true;
    const currentDiscrepancy = discrepancies[0];
    setAutoModeStatus(`Processing ${currentDiscrepancy.username}...`);

    try {
      // Combined action: get details and reconcile if criteria met (single DB connection)
      const result = await getDetailsAndMaybeReconcile(
        currentDiscrepancy.accountId,
      );

      if (result.action === "skipped") {
        setAutoModeStatus(
          `No details found for ${currentDiscrepancy.username}, skipping...`,
        );
        setDiscrepancies((prev) =>
          prev.filter((d) => d.accountId !== currentDiscrepancy.accountId),
        );
      } else if (result.action === "reconciled") {
        toast.success(
          `Auto-reconciled ${currentDiscrepancy.username}: ${result.result.itemsDeleted} items deleted, ${result.result.itemsUpdated} updated, ${result.result.activitiesDeleted} activities removed`,
        );
        setDiscrepancies((prev) =>
          prev.filter((d) => d.accountId !== currentDiscrepancy.accountId),
        );
        router.refresh();
      } else {
        // Paused - show the discrepancy for manual review
        setIsAutoMode(false);
        autoModeRef.current = false;
        setAutoModeInterrupted(true); // Mark as interrupted so we resume after manual resolution

        setAutoModeStatus(
          `Paused: ${currentDiscrepancy.username} - ${result.reasons.join(", ")}`,
        );
        setSelectedAccountId(currentDiscrepancy.accountId);
        setDetails(result.details);
        toast.info(`Auto-mode paused: ${result.reasons.join(", ")}`);
      }
    } catch (error) {
      setIsAutoMode(false);
      autoModeRef.current = false;
      setAutoModeStatus(`Error processing ${currentDiscrepancy.username}`);
      toast.error(
        `Auto-mode error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      processingRef.current = false;
    }
  }, [discrepancies, router]);

  // Effect to run auto-mode
  useEffect(() => {
    if (isAutoMode && !processingRef.current) {
      const timer = setTimeout(() => {
        processAutoMode();
      }, 1500); // Delay between processing to reduce DB connection pressure
      return () => clearTimeout(timer);
    }
  }, [isAutoMode, discrepancies, processAutoMode]);

  const toggleAutoMode = () => {
    if (isAutoMode) {
      setIsAutoMode(false);
      setAutoModeInterrupted(false); // Clear interrupted state when manually stopping
      setAutoModeStatus("Paused by user");
    } else {
      // Close any open dialog when starting auto-mode
      closeDialog();
      setAutoModeInterrupted(false);
      setIsAutoMode(true);
      setAutoModeStatus("Starting...");
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
      const nextIndex = Math.min(
        currentIndex,
        remainingDiscrepancies.length - 1,
      );
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

    const wasInterrupted = autoModeInterrupted;

    startTransition(async () => {
      try {
        const result = await reconcileDiscrepancy(selectedAccountId);
        toast.success(
          `Reconciled ${details.username}: ${result.itemsDeleted} items deleted, ${result.itemsUpdated} updated, ${result.activitiesDeleted} activities removed`,
        );
        
        // Remove from local state
        setDiscrepancies((prev) =>
          prev.filter((d) => d.accountId !== selectedAccountId),
        );
        closeDialog();
        router.refresh();
        
        // Resume auto-mode if it was interrupted
        if (wasInterrupted) {
          setAutoModeInterrupted(false);
          setIsAutoMode(true);
          setAutoModeStatus("Resuming...");
        }
      } catch (error) {
        toast.error("Failed to reconcile discrepancy");
        console.error(error);
      }
    });
  };

  const handleDismiss = async () => {
    if (!selectedAccountId || !details) return;

    const wasInterrupted = autoModeInterrupted;

    startTransition(async () => {
      try {
        await dismissDiscrepancy(selectedAccountId);
        toast.success(`Dismissed discrepancy for ${details.username}`);
        
        // Remove from local state
        setDiscrepancies((prev) =>
          prev.filter((d) => d.accountId !== selectedAccountId),
        );
        closeDialog();
        router.refresh();
        
        // Resume auto-mode if it was interrupted
        if (wasInterrupted) {
          setAutoModeInterrupted(false);
          setIsAutoMode(true);
          setAutoModeStatus("Resuming...");
        }
      } catch (error) {
        toast.error("Failed to dismiss discrepancy");
        console.error(error);
      }
    });
  };

  const selectedDiscrepancy = discrepancies.find(
    (d) => d.accountId === selectedAccountId,
  );

  const itemsToRemove =
    details?.items.filter((i) => i.realQuantity === 0) ?? [];
  const itemsToUpdate = details?.items.filter((i) => i.realQuantity > 0) ?? [];

  const fetchNextBatch = useCallback(async () => {
    setIsFetchingBatch(true);
    setAutoModeStatus("Fetching next batch...");
    try {
      const nextBatch = await getAllDiscrepancies();
      if (nextBatch.length === 0) {
        setAutoModeStatus("No more discrepancies in KV");
        toast.info("No more discrepancies found");
      } else {
        setDiscrepancies(nextBatch);
        setAutoModeStatus(`Fetched ${nextBatch.length} accounts`);
        toast.success(`Fetched ${nextBatch.length} discrepancies`);
      }
    } catch (error) {
      setAutoModeStatus("Error fetching batch");
      toast.error("Failed to fetch discrepancies");
    } finally {
      setIsFetchingBatch(false);
    }
  }, []);

  return (
    <>
      {/* Auto-mode controls */}
      {discrepancies.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 border rounded-lg bg-muted/50">
          <Button
            variant={isAutoMode ? "destructive" : "default"}
            size="sm"
            onClick={toggleAutoMode}
            disabled={isPending}
          >
            {isAutoMode ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause Auto-Mode
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Start Auto-Mode
              </>
            )}
          </Button>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Auto-reconciles accounts where all items are whitelisted
              (Graceful, Decorative, etc.) OR all dates are between Oct 14 -
              Nov 13.
            </p>
            {autoModeStatus && (
              <p className="text-sm font-medium mt-1">
                {isAutoMode && (
                  <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                )}
                {autoModeStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {discrepancies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No discrepancies in current batch</p>
          <p className="text-sm mb-4">
            All accounts in this batch have been processed.
          </p>
          <Button
            variant="default"
            onClick={fetchNextBatch}
            disabled={isFetchingBatch}
          >
            {isFetchingBatch ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Fetch Next Batch
          </Button>
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
              const toUpdate = d.items.filter((i) => i.realQuantity > 0).length;

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
      <Dialog
        open={!!selectedAccountId}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="!w-[80vw] !h-[80vh] !max-w-[800px] overflow-y-auto">
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
              {/* Item counts */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  Input items: <span className="font-medium text-foreground">{details.inputItemCount}</span>
                </span>
                <span>
                  Stored items: <span className="font-medium text-foreground">{details.storedItemCount}</span>
                </span>
              </div>

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
              <div className="border rounded-lg divide-y max-h-[50vh] overflow-y-auto">
                {details.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 p-2 text-sm"
                  >
                    <Image
                      src={`https://static.runelite.net/cache/item/icon/${item.itemId}.png`}
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
                      <Badge
                        variant="outline"
                        className="text-xs text-yellow-600"
                      >
                        {item.storedQuantity} → {item.realQuantity}
                      </Badge>
                    )}
                    {item.activityId && (
                      <span className="text-xs text-muted-foreground">
                        {item.activityCreatedAt
                          ? formatDate(item.activityCreatedAt)
                          : "activity"}
                      </span>
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
                    onClick={handleReconcile}
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
                    onClick={handleDismiss}
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
    </>
  );
}
