import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getAccountInfo, getDiscrepancyDetails } from "../actions";
import { DiscrepancyItemsTable } from "./DiscrepancyItemsTable";

export default async function DiscrepancyDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId: encodedAccountId } = await params;
  const accountId = decodeURIComponent(encodedAccountId);

  const [discrepancy, accountInfo] = await Promise.all([
    getDiscrepancyDetails(accountId),
    getAccountInfo(accountId),
  ]);

  if (!discrepancy) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/item-discrepancies">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Discrepancies
          </Link>
        </Button>

        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-medium">No Discrepancy Found</h2>
          <p className="text-muted-foreground text-sm mt-1">
            This account doesn&apos;t have any recorded item discrepancies, or
            it has already been reconciled.
          </p>
        </Card>
      </div>
    );
  }

  const itemsToRemove = discrepancy.items.filter((i) => i.realQuantity === 0);
  const itemsToUpdate = discrepancy.items.filter((i) => i.realQuantity > 0);

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/item-discrepancies">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Discrepancies
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            {discrepancy.username}&apos;s Item Discrepancies
          </h1>
          <p className="text-muted-foreground text-sm">
            Account ID: {accountId}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-3">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium block text-muted-foreground">
              Detected
            </span>
            <span>{formatDate(discrepancy.detectedAt)}</span>
          </div>
          <div>
            <span className="font-medium block text-muted-foreground">
              Total Discrepant Items
            </span>
            <span className="text-destructive font-bold">
              {discrepancy.items.length}
            </span>
          </div>
          <div>
            <span className="font-medium block text-muted-foreground">
              Items to Remove
            </span>
            <span className="text-red-600 font-bold">
              {itemsToRemove.length}
            </span>
            {itemsToRemove.filter((i) => i.activityId).length > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({itemsToRemove.filter((i) => i.activityId).length} with
                activities)
              </span>
            )}
          </div>
          <div>
            <span className="font-medium block text-muted-foreground">
              Items to Update Qty
            </span>
            <span className="text-yellow-600 font-bold">
              {itemsToUpdate.length}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t">
          <div>
            <span className="font-medium block text-muted-foreground">
              Input Item Count
            </span>
            <span>{discrepancy.inputItemCount}</span>
          </div>
          <div>
            <span className="font-medium block text-muted-foreground">
              Stored Item Count
            </span>
            <span>{discrepancy.storedItemCount}</span>
          </div>
          <div>
            <span className="font-medium block text-muted-foreground">
              Account Exists
            </span>
            <span>{accountInfo ? "Yes" : "No (deleted)"}</span>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <DiscrepancyItemsTable
        accountId={accountId}
        items={discrepancy.items}
        username={discrepancy.username}
      />
    </div>
  );
}
