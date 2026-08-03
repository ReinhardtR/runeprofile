"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Download, RotateCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ModelCanvas, type ModelStats } from "./ModelCanvas";
import { searchAccountsForModels } from "./actions";

/** Derived from the action so it cannot drift from what the query selects. */
type Account = Awaited<ReturnType<typeof searchAccountsForModels>>[number];

type Loaded = {
  username: string;
  player: ArrayBuffer;
  pet: ArrayBuffer | null;
};

export function ModelViewerClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Account[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [stats, setStats] = useState<{
    player: ModelStats;
    pet: ModelStats | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPet, setShowPet] = useState(true);
  const [spin, setSpin] = useState(false);

  // Debounced so typing a username does not fire a query per keystroke.
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchAccountsForModels(term));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    let current = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setStats(null);
      setLoaded(null);
      try {
        const [player, pet] = await Promise.all([
          fetch(`/api/models/${encodeURIComponent(selected.username)}`),
          fetch(`/api/models/${encodeURIComponent(selected.username)}?pet`),
        ]);
        if (!current) return;

        if (player.status === 404) {
          setError(
            "This account has no model stored. It has never synced one.",
          );
          return;
        }
        if (!player.ok) {
          setError(`Could not read the model (HTTP ${player.status}).`);
          return;
        }

        setLoaded({
          username: selected.username,
          player: await player.arrayBuffer(),
          // 204 means the character had no pet out when they last synced.
          pet: pet.status === 200 ? await pet.arrayBuffer() : null,
        });
      } catch (cause) {
        if (current) setError(String(cause));
      } finally {
        if (current) setLoading(false);
      }
    };

    load();
    return () => {
      current = false;
    };
  }, [selected]);

  const onStats = useCallback(
    (next: { player: ModelStats; pet: ModelStats | null }) => setStats(next),
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Username, id, or id prefix"
              className="pl-8"
              autoFocus
            />
          </div>

          {searching && <Skeleton className="h-8 w-full" />}

          {results !== null && !searching && (
            <div className="max-h-[420px] overflow-y-auto -mx-1">
              {results.length === 0 ? (
                <p className="px-1 text-sm text-neutral-500">
                  No accounts found.
                </p>
              ) : (
                results.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelected(account)}
                    className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      selected?.id === account.id
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{account.username}</span>
                    {account.updatedAt && (
                      <span className="block text-xs text-neutral-500">
                        synced {new Date(account.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </Card>

        {stats && (
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold">Model</h2>
            <StatRows stats={stats.player} />
            {stats.pet && (
              <>
                <Separator />
                <h2 className="text-sm font-semibold">Pet</h2>
                <StatRows stats={stats.pet} />
              </>
            )}
          </Card>
        )}
      </div>

      <Card className="flex flex-col overflow-hidden min-h-[620px] p-0">
        {loaded && (
          <div className="flex flex-wrap items-center gap-4 border-b p-3">
            <span className="font-medium">{loaded.username}</span>
            {loaded.pet && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={showPet} onCheckedChange={setShowPet} />
                Pet
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={spin} onCheckedChange={setSpin} />
              <RotateCw className="size-3.5" />
              Spin
            </label>
            <Button asChild size="sm" variant="outline" className="ml-auto">
              <a
                href={`/api/models/${encodeURIComponent(loaded.username)}`}
                download={`${loaded.username}.${stats?.player.format ?? "glb"}`}
              >
                <Download className="size-3.5" />
                Download
              </a>
            </Button>
          </div>
        )}

        <div className="relative flex-1">
          {!selected && (
            <Placeholder>Search for an account to view its model.</Placeholder>
          )}
          {selected && loading && <Placeholder>Loading model…</Placeholder>}
          {error && <Placeholder tone="error">{error}</Placeholder>}
          {loaded && !error && (
            <ModelCanvas
              // Remount on a new model: the canvas builds its scene on mount.
              key={`${loaded.username}-${showPet}`}
              player={loaded.player}
              pet={showPet ? loaded.pet : null}
              spin={spin}
              onStats={onStats}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function StatRows({ stats }: { stats: ModelStats }) {
  const rows: Array<[string, string]> = [
    ["Format", stats.format.toUpperCase()],
    ["Size", `${(stats.bytes / 1024).toFixed(1)} KB`],
    ["Triangles", stats.triangles.toLocaleString()],
    ["Meshes", String(stats.meshes)],
    ["Materials", String(stats.materials)],
    ["Textures", String(stats.textures)],
  ];
  return (
    <dl className="space-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-neutral-500">{label}</dt>
          <dd className="font-mono">
            {label === "Format" ? (
              <Badge variant="secondary">{value}</Badge>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Placeholder({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "error";
}) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center text-sm">
      <p className={tone === "error" ? "text-red-500" : "text-neutral-500"}>
        {children}
      </p>
    </div>
  );
}
