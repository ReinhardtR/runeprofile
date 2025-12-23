import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";

import { AccountItemsTable } from "./AccountItemsTable";
import { getAccountItems, getItemStats } from "./actions";

export default async function AccountItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; from?: string; itemId?: string; sortBy?: string }>;
}) {
  const { id: encodedId } = await params;
  const { page: pageStr = "1", from, itemId, sortBy = "id" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  // Decode the URI-encoded account ID
  const id = decodeURIComponent(encodedId);

  console.log("Encoded ID from URL:", encodedId);
  console.log("Decoded account ID:", id);

  try {
    // Get account items and stats
    const [itemsData, stats] = await Promise.all([
      getAccountItems(id, page, 50, itemId, sortBy),
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

        {/* Search */}
        <Card className="p-4">
          <form action={`/accounts/${encodeURIComponent(id)}/items`} method="get">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  name="itemId"
                  placeholder="Search by Item ID..."
                  defaultValue={itemId || ""}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="default">
                Search
              </Button>
              {itemId && (
                <Button variant="outline" asChild>
                  <Link href={`/accounts/${encodeURIComponent(id)}/items`}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Link>
                </Button>
              )}
            </div>
            {itemId && (
              <p className="text-sm text-muted-foreground mt-2">
                Filtering by Item ID: <span className="font-mono font-medium">{itemId}</span>
              </p>
            )}
          </form>
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
                          href={`/accounts/${encodeURIComponent(id)}/items?page=${currentPage - 1}${itemId ? `&itemId=${encodeURIComponent(itemId)}` : ""}${sortBy !== "id" ? `&sortBy=${sortBy}` : ""}`}
                        >
                          Previous
                        </Link>
                      </Button>
                    )}
                    {hasMore && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/accounts/${encodeURIComponent(id)}/items?page=${currentPage + 1}${itemId ? `&itemId=${encodeURIComponent(itemId)}` : ""}${sortBy !== "id" ? `&sortBy=${sortBy}` : ""}`}
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
                searchItemId={itemId}
                sortBy={sortBy}
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
