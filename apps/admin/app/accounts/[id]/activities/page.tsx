import { AccountActivitiesTable } from "@/app/accounts/[id]/activities/AccountActivitiesTable";
import { AddActivityDialog } from "@/app/accounts/[id]/activities/AddActivityDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getAccountActivities, getActivityTypeStats } from "./actions";

export default async function AccountActivitiesPage({
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
    // Get account activities and stats
    const [activitiesData, typeStats] = await Promise.all([
      getAccountActivities(id, page),
      getActivityTypeStats(id),
    ]);

    const { account, activities, totalCount, hasMore, currentPage } =
      activitiesData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                {account.username}&apos;s Activities
              </h1>
              <p className="text-muted-foreground text-sm">
                Account ID: {account.id}
              </p>
            </div>
          </div>
          <AddActivityDialog accountId={id} />
        </div>

        {/* Statistics */}
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-3">Activity Statistics</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Total Activities:</span>{" "}
              <Badge variant="secondary">{totalCount.toLocaleString()}</Badge>
            </p>
            {typeStats.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">By Type:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {typeStats.slice(0, 10).map((stat) => (
                    <Badge
                      key={stat.type}
                      variant="outline"
                      className="text-xs"
                    >
                      {stat.type.replace(/_/g, " ")}:{" "}
                      {stat.count.toLocaleString()}
                    </Badge>
                  ))}
                  {typeStats.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{typeStats.length - 10} more types
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Activities Table */}
        <Card className="p-4 space-y-4">
          {activities.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">
              This account has no activities.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {currentPage === 1 && totalCount > 0
                    ? `Showing ${activities.length} of ${totalCount.toLocaleString()} activities`
                    : `Page ${currentPage} - ${activities.length} activities`}
                </p>
                {(currentPage > 1 || hasMore) && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/accounts/${encodeURIComponent(id)}/activities?page=${currentPage - 1}`}
                        >
                          Previous
                        </Link>
                      </Button>
                    )}
                    {hasMore && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/accounts/${encodeURIComponent(id)}/activities?page=${currentPage + 1}`}
                        >
                          Next
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <AccountActivitiesTable
                accountId={id}
                activities={activities}
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
                : "Failed to load account activities"}
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
