import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ResultsTable } from "./ResultsTable";
import { searchAccounts } from "./actions";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const rows = await searchAccounts(q);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
      <Card className="p-4 space-y-4">
        <form action="/accounts" method="get" className="flex gap-2">
          <Input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Username, id, or id prefix"
            className="max-w-sm"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        {q === "" ? (
          <p className="text-neutral-500 text-sm">Type to search accounts.</p>
        ) : rows.length === 0 ? (
          <p className="text-neutral-500 text-sm">No results.</p>
        ) : (
          <ResultsTable rows={rows} searchQuery={q} />
        )}
      </Card>
    </div>
  );
}
