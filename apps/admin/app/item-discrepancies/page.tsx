import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

import { DiscrepancyList } from "./DiscrepancyList";
import { getAllDiscrepancies } from "./actions";

export default async function ItemDiscrepanciesPage() {
  const discrepancies = await getAllDiscrepancies();

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
        <DiscrepancyList initialDiscrepancies={discrepancies} />
      </Card>
    </div>
  );
}
