"use client";

import { deleteActivityIdsAction } from "@/app/dup-activities/actions";
import { DeleteDuplicatesButton } from "@/components/delete-duplicates-button";
import { useState } from "react";

interface DuplicateGroup {
  type: string;
  data: unknown;
  rows: { id: string; createdAt: string }[];
  toDeleteIds: string[];
}

export function DuplicateGroupsClient({
  initialGroups,
}: {
  initialGroups: DuplicateGroup[];
  accountId: string;
}) {
  const [groups, setGroups] = useState<DuplicateGroup[]>(initialGroups);
  const [optimisticGroups, setOptimisticGroups] = useState<
    DuplicateGroup[] | null
  >(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDelete = async (group: DuplicateGroup) => {
    if (!group.toDeleteIds.length) return;
    setPendingId(group.toDeleteIds[0]);
    try {
      setOptimisticGroups((prev) =>
        (prev ?? groups).filter(
          (g) => !g.toDeleteIds.every((id) => group.toDeleteIds.includes(id)),
        ),
      );
      await deleteActivityIdsAction(group.toDeleteIds);
      setGroups((gs) => gs.filter((g) => g !== group));
      // No auto-advance; user controls navigation.
    } finally {
      setPendingId(null);
    }
  };

  const renderGroups =
    optimisticGroups && optimisticGroups.length ? optimisticGroups : groups;

  if (!renderGroups.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No duplicate groups for this account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {renderGroups.map((g: DuplicateGroup, i: number) => {
        const deleting =
          pendingId !== null && g.toDeleteIds.includes(pendingId);
        return (
          <div
            key={i}
            className="rounded-md border p-3 space-y-2 bg-background/40"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{g.type}</span>
              <span className="truncate max-w-[320px]">
                {JSON.stringify(g.data)}
              </span>
              <span className="ml-auto">{g.rows.length} entries</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {g.rows.map((r: { id: string; createdAt: string }) => (
                <span
                  key={r.id}
                  className="px-1.5 py-0.5 rounded bg-muted font-mono"
                >
                  {r.id}
                </span>
              ))}
            </div>
            {g.toDeleteIds.length ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleDelete(g);
                }}
              >
                <DeleteDuplicatesButton count={g.toDeleteIds.length} />
              </form>
            ) : null}
            {deleting && (
              <p className="text-xs text-muted-foreground">Deleting…</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
