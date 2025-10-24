import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AccountItemsTable } from "./AccountItemsTable";
import { getAccountItems, getItemStats } from "./actions";

export default async function AccountItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; from?: string }>;
}) {
  const { id: encodedId } = await params;
  const { page: pageStr = "1", from } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  // Decode the URI-encoded account ID
  const id = decodeURIComponent(encodedId);

  console.log("Encoded ID from URL:", encodedId);
  console.log("Decoded account ID:", id);

  try {
    // Get account items and stats
    const [itemsData, stats] = await Promise.all([
      getAccountItems(id, page),
      getItemStats(id),
    ]);

    const { account, items, totalCount, hasMore, currentPage } = itemsData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/accounts${from ? `?q=${encodeURIComponent(from)}` : ""}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Accounts
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {account.username}&apos;s Items
            </h1>
            <p className="text-muted-foreground text-sm">
              Account ID: {account.id}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Item Statistics</h2>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-medium">Unique Items:</span>{" "}
              <Badge variant="secondary">
                {stats.totalItems.toLocaleString()}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Total Quantity:</span>{" "}
              <Badge variant="outline">
                {stats.totalQuantity.toLocaleString()}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        <Card className="p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">
              This account has no items.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {currentPage === 1 && totalCount > 0
                    ? `Showing ${items.length} of ${totalCount.toLocaleString()} items`
                    : `Page ${currentPage} - ${items.length} items`}
                </p>
                {(currentPage > 1 || hasMore) && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/accounts/${encodeURIComponent(id)}/items?page=${currentPage - 1}`}
                        >
                          Previous
                        </Link>
                      </Button>
                    )}
                    {hasMore && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/accounts/${encodeURIComponent(id)}/items?page=${currentPage + 1}`}
                        >
                          Next
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <AccountItemsTable
                accountId={id}
                items={items}
                currentPage={currentPage}
              />
            </div>
          )}
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/accounts${from ? `?q=${encodeURIComponent(from)}` : ""}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Accounts
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Account Not Found
          </h1>
        </div>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-red-600 font-medium">
              {error instanceof Error
                ? error.message
                : "Failed to load account items"}
            </p>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Encoded ID from URL:</strong> {encodedId}
              </p>
              <p>
                <strong>Decoded ID for DB lookup:</strong> {id}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}
