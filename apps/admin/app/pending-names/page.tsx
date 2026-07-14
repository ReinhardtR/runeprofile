import { Card } from "@/components/ui/card";

import { PendingNamesTable } from "./PendingNamesTable";
import { getPendingNames } from "./actions";

export const dynamic = "force-dynamic";

export default async function PendingNamesPage() {
  const rows = await getPendingNames();
  const freeCount = rows.filter((r) => !r.holderUsername).length;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pending Names</h1>
      <Card className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Accounts waiting on a username held by another row. The plugin
          reports an account&apos;s actual in-game name, so a claimant with a
          long-idle holder is almost certainly the name&apos;s current owner.
          Resolve archives the holder under a placeholder and grants the name;
          Clear drops the claim (it reappears if the claimant syncs with the
          same name).
        </p>
        <p className="text-sm">
          <span className="font-medium">{rows.length}</span> pending
          {freeCount > 0 && (
            <>
              {" "}
              · <span className="font-medium">{freeCount}</span> grantable
              without archiving
            </>
          )}
        </p>
        {rows.length === 0 ? (
          <p className="text-neutral-500 text-sm">No pending names.</p>
        ) : (
          <PendingNamesTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
