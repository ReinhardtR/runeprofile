"use client";

import {
  deleteActivityIdsAction,
  revalidateDupActivities,
} from "@/app/dup-activities/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { useState, useTransition } from "react";

interface ActivityRow {
  id: string;
  type: string;
  data: unknown;
  createdAt: string;
}

export function AccountActivitiesClient({
  initial,
  nextHref,
  autoStart = false,
}: {
  initial: ActivityRow[];
  nextHref: string | null;
  autoStart?: boolean;
}) {
  const [rows, setRows] = useState<ActivityRow[]>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [autoMode, setAutoMode] = useState(autoStart);
  const [autoStoppedReason, setAutoStoppedReason] = useState<string | null>(
    null,
  );
  const [showDialog, setShowDialog] = useState(false);

  // Initialize auto mode based on localStorage (fallback to prop on first load).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("dupAutoMode");
      if (stored === "1") {
        setAutoMode(true);
      } else if (autoStart) {
        setAutoMode(true);
        localStorage.setItem("dupAutoMode", "1");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string, checked: boolean | string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      await deleteActivityIdsAction(ids);
      setRows((r) => r.filter((x) => !selected.has(x.id)));
      setSelected(new Set());
    });
  };

  // Compute duplicates: keep earliest (oldest createdAt) per (type,data) key; others are duplicates.
  useEffect(() => {
    const byKey: Record<
      string,
      { earliest: ActivityRow | null; others: ActivityRow[] }
    > = {};
    for (const r of rows) {
      const key = `${r.type}::${JSON.stringify(r.data)}`;
      const existing = byKey[key];
      if (!existing) {
        byKey[key] = { earliest: r, others: [] };
      } else {
        // Compare createdAt to decide earliest
        const earliest = existing.earliest!;
        if (new Date(r.createdAt) < new Date(earliest.createdAt)) {
          // New earliest found: move previous earliest into others list
          existing.others.push(earliest);
          existing.earliest = r;
        } else {
          existing.others.push(r);
        }
      }
    }
    const dupSet = new Set<string>();
    Object.values(byKey).forEach((g) =>
      g.others.forEach((r) => dupSet.add(r.id)),
    );

    // Special rule: if an account has level 99 events for ALL of these skills
    // on the same calendar day, mark those events for deletion (likely bogus):
    // Smithing, Construction, Attack, Strength, Defence, Prayer, Ranged, Magic
    const REQUIRED_99_SKILLS = [
      "Hitpoints",
      "Smithing",
      "Construction",
      "Attack",
      "Strength",
      "Defence",
      "Prayer",
      "Ranged",
      "Magic",
    ];
    const requiredSetLower = new Set(
      REQUIRED_99_SKILLS.map((s) => s.toLowerCase()),
    );
    interface NinetyNineInfo {
      id: string;
      skill: string;
    }
    const dayMap: Record<string, NinetyNineInfo[]> = {};
    for (const r of rows) {
      if (r.type !== "level_up") continue;
      try {
        const data = r.data as unknown as {
          level?: number;
          skill?: string;
          name?: string;
        };
        if (data?.level !== 99) continue;
        const skillName = (data.skill || data.name || "").toString();
        if (!skillName) continue;
        if (!requiredSetLower.has(skillName.toLowerCase())) continue;
        const day = r.createdAt.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push({ id: r.id, skill: skillName });
      } catch {
        // ignore malformed
      }
    }
    for (const day of Object.keys(dayMap)) {
      const skillsLower = new Set(
        dayMap[day].map((e) => e.skill.toLowerCase()),
      );
      let includesAll = true;
      for (const req of requiredSetLower) {
        if (!skillsLower.has(req)) {
          includesAll = false;
          break;
        }
      }
      if (includesAll) {
        // Mark all those level 99 events for deletion
        dayMap[day].forEach((e) => dupSet.add(e.id));
      }
    }

    setDuplicateIds(dupSet);
    // Preselect duplicates initially
    setSelected(dupSet);
  }, [rows]);

  // Detect odd cases: only presence of a maxed event now.
  const detectOddCase = (activityRows: ActivityRow[]) => {
    let hasMaxed = false;
    for (const r of activityRows) {
      if (r.type === "maxed") {
        hasMaxed = true;
        break;
      }
    }
    return { hasMaxed, odd: hasMaxed };
  };

  // Attempt auto progression when enabled
  useEffect(() => {
    if (!autoMode) return;
    // If currently deleting, wait
    if (pending) return;
    const { odd } = detectOddCase(rows);
    if (odd) {
      setAutoMode(false);
      setAutoStoppedReason("Odd case detected (maxed event).");
      setShowDialog(true);
      return;
    }
    // If there are duplicates selected, delete them then continue
    if (selected.size) {
      void (async () => {
        await deleteSelected();
        // After deletion, if still duplicates remain, next cycle will handle.
        // If none remain and we have a nextHref, navigate.
        setTimeout(() => {
          if (!duplicateIds.size && nextHref) {
            window.location.href = nextHref;
          } else if (!duplicateIds.size && !nextHref) {
            // Start a new batch: remove ids param and revalidate
            void (async () => {
              try {
                await revalidateDupActivities();
              } catch {}
              const url = new URL(window.location.href);
              url.searchParams.delete("ids");
              url.searchParams.set("i", "0");
              if (autoMode) url.searchParams.set("auto", "1");
              window.location.href =
                url.pathname + "?" + url.searchParams.toString();
            })();
          }
        }, 50);
      })();
    } else {
      // No duplicates to delete; proceed to next account or stop
      if (nextHref) {
        window.location.href = nextHref;
      } else {
        void (async () => {
          try {
            await revalidateDupActivities();
          } catch {}
          const url = new URL(window.location.href);
          url.searchParams.delete("ids");
          url.searchParams.set("i", "0");
          if (autoMode) url.searchParams.set("auto", "1");
          window.location.href =
            url.pathname + "?" + url.searchParams.toString();
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, rows, selected, pending, nextHref]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{rows.length} activities (desc)</span>
          <span className="font-medium">|</span>
          <span>{selected.size} selected</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs select-none">
            <input
              type="checkbox"
              className="accent-primary"
              checked={autoMode}
              onChange={(e) => {
                if (e.target.checked) {
                  setAutoStoppedReason(null);
                  setShowDialog(false);
                  setAutoMode(true);
                  try {
                    localStorage.setItem("dupAutoMode", "1");
                  } catch {}
                } else {
                  setAutoMode(false);
                  try {
                    localStorage.removeItem("dupAutoMode");
                  } catch {}
                }
              }}
            />
            Auto Mode
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void deleteSelected();
            }}
          >
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={!selected.size || pending}
              className={pending ? "cursor-wait opacity-80" : "cursor-pointer"}
            >
              {pending ? "Deleting…" : `Delete Selected (${selected.size})`}
            </Button>
          </form>
        </div>
      </div>
      {autoStoppedReason && showDialog && (
        <div className="border rounded-md p-3 bg-yellow-50 text-xs text-yellow-900 space-y-2">
          <div className="font-medium">Auto Mode Paused</div>
          <p>{autoStoppedReason}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAutoStoppedReason(null);
                setShowDialog(false);
                setAutoMode(true);
              }}
            >
              Resume Auto
            </Button>
          </div>
        </div>
      )}
      <div className="border rounded-md divide-y max-h-[480px] overflow-auto text-xs">
        {rows.map((r) => {
          const checked = selected.has(r.id);
          const isDup = duplicateIds.has(r.id);
          return (
            <label
              key={r.id}
              className={`flex items-start gap-2 p-2 cursor-pointer transition-colors ${isDup ? "bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive" : "hover:bg-accent"}`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => toggle(r.id, c)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">
                    {r.id}
                  </span>
                  <span className="font-medium">{r.type}</span>
                  {isDup && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
                      DUP
                    </span>
                  )}
                  <span
                    className="text-muted-foreground ml-auto tabular-nums"
                    suppressHydrationWarning
                  >
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="text-[10px] whitespace-pre-wrap break-all bg-muted/50 p-1 rounded">
                  {JSON.stringify(r.data)}
                </pre>
              </div>
            </label>
          );
        })}
        {!rows.length && (
          <div className="p-4 text-muted-foreground">No activities.</div>
        )}
      </div>
    </div>
  );
}
