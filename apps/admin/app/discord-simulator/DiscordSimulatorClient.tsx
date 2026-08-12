"use client";

import { DynamicActivityForm } from "@/app/accounts/[id]/activities/DynamicActivityForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Loader2, Search, Send, X } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AccountTypes,
  ActivityEvent,
  COLLECTION_LOG_ITEMS,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTaskByIndex,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import {
  getRecentActivities,
  previewDiscordCard,
  searchAccountsForSimulator,
  sendDiscordEmbeds,
} from "./actions";

type AccountResult = {
  id: string;
  username: string;
  accountType: number;
  clanName: string | null;
};

type ActivityRow = {
  id: string;
  type: string;
  data: unknown;
  createdAt: string | null;
};

// ── Display helpers (client-side, no server action needed) ──────────────

function getItemName(itemId: number): string {
  return COLLECTION_LOG_ITEMS[itemId] ?? `Unknown Item (${itemId})`;
}

function numberWithDelimiter(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberWithAbbreviation(x: number): string {
  if (x < 1e3) return x.toString();
  if (x >= 1e3 && x < 1e6) return +(x / 1e3).toFixed(1) + "K";
  if (x >= 1e6 && x < 1e9) return +(x / 1e6).toFixed(1) + "M";
  if (x >= 1e9 && x < 1e12) return +(x / 1e9).toFixed(1) + "B";
  return x.toString();
}

function getActivityLabel(activity: { type: string; data: unknown }): string {
  const data = activity.data as Record<string, unknown>;
  switch (activity.type) {
    case "level_up":
      return `Level ${data.level} ${data.name}`;
    case "new_item_obtained":
      return getItemName(data.itemId as number);
    case "valuable_drop":
      return `${getItemName(data.itemId as number)} (${numberWithDelimiter(data.value as number)} gp)`;
    case "xp_milestone":
      return `${numberWithAbbreviation(data.xp as number)} XP in ${data.name}`;
    case "quest_completed": {
      const quest = getQuestById(data.questId as number);
      return quest?.name ?? "Unknown Quest";
    }
    case "achievement_diary_tier_completed": {
      const area =
        getAchievementDiaryAreaName(data.areaId as number) ?? "Unknown";
      const tier =
        getAchievementDiaryTierName(data.tier as number) ?? "Unknown";
      return `${tier} ${area} Diary`;
    }
    case "combat_achievement_tier_completed": {
      const tierName =
        getCombatAchievementTierName(data.tierId as number) ?? "Unknown";
      return `${tierName} Combat Achievements`;
    }
    case "combat_achievement_task_completed": {
      const task = getCombatAchievementTaskByIndex(data.taskIndex as number);
      const tierName = task
        ? (getCombatAchievementTierName(task.tierId) ?? "Unknown")
        : "Unknown";
      return `${task?.name ?? "Unknown Task"} (${tierName})`;
    }
    case "maxed":
      return "Maxed!";
    default:
      return activity.type;
  }
}

// One representative event per activity type, for one-click test sends.
const PRESET_ACTIVITIES: { label: string; activity: ActivityEvent }[] = [
  {
    label: "Level Up · 99 Slayer",
    activity: { type: "level_up", data: { name: "Slayer", level: 99 } },
  },
  {
    label: "XP Milestone · 50M Slayer",
    activity: { type: "xp_milestone", data: { name: "Slayer", xp: 50_000_000 } },
  },
  {
    label: "Collection Log · Twisted bow",
    activity: { type: "new_item_obtained", data: { itemId: 20997 } },
  },
  {
    label: "Valuable Drop · Twisted bow",
    activity: {
      type: "valuable_drop",
      data: { itemId: 20997, value: 1_450_000_000 },
    },
  },
  {
    label: "Quest · Desert Treasure II",
    activity: { type: "quest_completed", data: { questId: 2343 } },
  },
  {
    label: "Diary · Elite Desert",
    activity: {
      type: "achievement_diary_tier_completed",
      data: { areaId: 5, tier: 3 },
    },
  },
  {
    label: "CA Tier Completed · Grandmaster",
    activity: {
      type: "combat_achievement_tier_completed",
      data: { tierId: 6 },
    },
  },
  {
    label: "CA Tier Reached · Master",
    activity: { type: "combat_achievement_tier_reached", data: { tierId: 5 } },
  },
  {
    label: "CA Task · The Worst Ranged Weapon",
    activity: {
      type: "combat_achievement_task_completed",
      data: { taskIndex: 14 },
    },
  },
  {
    label: "Maxed",
    activity: { type: "maxed", data: {} },
  },
];

export function DiscordSimulatorClient({
  defaultChannelId,
}: {
  defaultChannelId: string;
}) {
  const [channelId, setChannelId] = useState(defaultChannelId);
  const [format, setFormat] = useState<"embeds" | "cards">("cards");

  // ── From Account state ──
  const [query, setQuery] = useState("");
  const [accountResults, setAccountResults] = useState<AccountResult[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResult | null>(
    null,
  );
  const [accountActivities, setAccountActivities] = useState<ActivityRow[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSearching, startSearchTransition] = useTransition();
  const [isLoadingActivities, startLoadActivities] = useTransition();

  // ── Manual state ──
  const [manualRsn, setManualRsn] = useState("");
  const [manualAccountType, setManualAccountType] = useState("0");

  // ── Shared ──
  const [isSending, startSendTransition] = useTransition();
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(
    null,
  );

  const handlePreview = useCallback(
    (activity: ActivityEvent, label: string, rsn?: string, type?: number) => {
      startPreviewTransition(async () => {
        try {
          const src = await previewDiscordCard({
            activity,
            rsn: rsn ?? (manualRsn || "TestPlayer"),
            accountType: type ?? Number(manualAccountType),
          });
          setPreview({ src, label });
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to render preview",
          );
        }
      });
    },
    [manualRsn, manualAccountType],
  );

  // ── Handlers ──
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    startSearchTransition(async () => {
      const results = await searchAccountsForSimulator(query);
      setAccountResults(results);
      setSelectedAccount(null);
      setAccountActivities([]);
      setSelectedActivityIds(new Set());
    });
  }, [query]);

  const handleSelectAccount = useCallback((account: AccountResult) => {
    setSelectedAccount(account);
    setSelectedActivityIds(new Set());
    startLoadActivities(async () => {
      const acts = await getRecentActivities(account.id);
      setAccountActivities(acts);
    });
  }, []);

  const toggleActivity = useCallback((activityId: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedActivityIds((prev) => {
      if (prev.size === accountActivities.length) {
        return new Set();
      }
      return new Set(accountActivities.map((a) => a.id));
    });
  }, [accountActivities]);

  const handleSendFromAccount = useCallback(() => {
    if (!selectedAccount || selectedActivityIds.size === 0) return;
    startSendTransition(async () => {
      try {
        const selected = accountActivities.filter((a) =>
          selectedActivityIds.has(a.id),
        );
        const result = await sendDiscordEmbeds({
          channelId,
          activities: selected.map(
            (a) => ({ type: a.type, data: a.data }) as ActivityEvent,
          ),
          rsn: selectedAccount.username,
          accountType: selectedAccount.accountType,
          format,
        });
        toast.success(`Sent ${result.sent} ${format} to Discord`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send embeds",
        );
      }
    });
  }, [selectedAccount, selectedActivityIds, accountActivities, channelId, format]);

  const handleSendManual = useCallback(
    async (activityData: ActivityEvent) => {
      startSendTransition(async () => {
        try {
          const result = await sendDiscordEmbeds({
            channelId,
            activities: [activityData],
            rsn: manualRsn || "TestPlayer",
            accountType: Number(manualAccountType),
            format,
          });
          toast.success(`Sent ${result.sent} ${format} to Discord`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to send embeds",
          );
        }
      });
    },
    [channelId, manualRsn, manualAccountType, format],
  );

  const handleSendPresets = useCallback(
    async (presets: ActivityEvent[]) => {
      startSendTransition(async () => {
        try {
          const result = await sendDiscordEmbeds({
            channelId,
            activities: presets,
            rsn: manualRsn || "TestPlayer",
            accountType: Number(manualAccountType),
            format,
          });
          toast.success(`Sent ${result.sent} ${format} to Discord`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to send presets",
          );
        }
      });
    },
    [channelId, manualRsn, manualAccountType, format],
  );

  const getActivityTypeLabel = (type: string) =>
    type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="space-y-6">
      {/* Channel ID + format */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6">
          <div className="space-y-2 flex-1 min-w-64">
            <Label htmlFor="channel-id">Discord Channel ID</Label>
            <Input
              id="channel-id"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Paste a Discord channel ID"
              className="max-w-md font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Right-click a channel in Discord → Copy Channel ID. Overrides
              the default from your environment.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-format">Message Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as "embeds" | "cards")}
            >
              <SelectTrigger id="message-format" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards (images)</SelectItem>
                <SelectItem value="embeds">Embeds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cards render the player model into a styled image.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="from-account">
        <TabsList>
          <TabsTrigger value="from-account">From Account</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        {/* ── From Account ─────────────────────────────────────── */}
        <TabsContent value="from-account" className="space-y-4">
          {/* Search */}
          <Card className="p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className="max-w-sm"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </form>

            {/* Account results */}
            {accountResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {accountResults.length} result(s)
                </p>
                <div className="grid gap-1">
                  {accountResults.map((acct) => {
                    const typeName =
                      AccountTypes.find((t) => t.id === acct.accountType)
                        ?.name ?? "Normal";
                    return (
                      <button
                        type="button"
                        key={acct.id}
                        onClick={() => handleSelectAccount(acct)}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent ${
                          selectedAccount?.id === acct.id
                            ? "border-primary bg-accent"
                            : ""
                        }`}
                      >
                        <span className="font-medium">{acct.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {typeName}
                          {acct.clanName ? ` · ${acct.clanName}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Activities for selected account */}
          {selectedAccount && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Activities for{" "}
                  <span className="font-semibold">
                    {selectedAccount.username}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  {accountActivities.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAll}
                    >
                      {selectedActivityIds.size === accountActivities.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const first = accountActivities.find((a) =>
                        selectedActivityIds.has(a.id),
                      );
                      if (!first || !selectedAccount) return;
                      handlePreview(
                        { type: first.type, data: first.data } as ActivityEvent,
                        getActivityLabel(first),
                        selectedAccount.username,
                        selectedAccount.accountType,
                      );
                    }}
                    disabled={isPreviewing || selectedActivityIds.size === 0}
                  >
                    {isPreviewing ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <Eye className="size-4 mr-1" />
                    )}
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendFromAccount}
                    disabled={
                      isSending ||
                      selectedActivityIds.size === 0 ||
                      !channelId.trim()
                    }
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <Send className="size-4 mr-1" />
                    )}
                    Send{" "}
                    {selectedActivityIds.size > 0 &&
                      `(${selectedActivityIds.size})`}
                  </Button>
                </div>
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : accountActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activities found for this account.
                </p>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {accountActivities.map((act) => (
                    <label
                      key={act.id}
                      htmlFor={`act-${act.id}`}
                      className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                    >
                      <Checkbox
                        id={`act-${act.id}`}
                        checked={selectedActivityIds.has(act.id)}
                        onCheckedChange={() => toggleActivity(act.id)}
                      />
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono shrink-0">
                        {getActivityTypeLabel(act.type)}
                      </span>
                      <span className="truncate flex-1">
                        {getActivityLabel(act)}
                      </span>
                      {act.createdAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(act.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* ── Manual ───────────────────────────────────────────── */}
        <TabsContent value="manual" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-rsn">Player Name (RSN)</Label>
                <Input
                  id="manual-rsn"
                  value={manualRsn}
                  onChange={(e) => setManualRsn(e.target.value)}
                  placeholder="TestPlayer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-account-type">Account Type</Label>
                <Select
                  value={manualAccountType}
                  onValueChange={setManualAccountType}
                >
                  <SelectTrigger id="manual-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AccountTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DynamicActivityForm
              onSubmit={handleSendManual}
              isLoading={isSending}
              submitText={
                channelId.trim()
                  ? "Send to Discord"
                  : "Enter a Channel ID first"
              }
            />
          </Card>
        </TabsContent>

        {/* ── Presets ──────────────────────────────────────────── */}
        <TabsContent value="presets" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preset-rsn">Player Name (RSN)</Label>
                <Input
                  id="preset-rsn"
                  value={manualRsn}
                  onChange={(e) => setManualRsn(e.target.value)}
                  placeholder="TestPlayer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-account-type">Account Type</Label>
                <Select
                  value={manualAccountType}
                  onValueChange={setManualAccountType}
                >
                  <SelectTrigger id="preset-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AccountTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                One click sends a representative event of that type.
              </p>
              <Button
                size="sm"
                onClick={() =>
                  handleSendPresets(PRESET_ACTIVITIES.map((p) => p.activity))
                }
                disabled={isSending || !channelId.trim()}
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Send className="size-4 mr-1" />
                )}
                Send All ({PRESET_ACTIVITIES.length})
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {PRESET_ACTIVITIES.map((preset) => (
                <div key={preset.label} className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start font-normal min-w-0"
                    onClick={() => handleSendManual(preset.activity)}
                    disabled={isSending || !channelId.trim()}
                  >
                    <Send className="size-3.5 mr-2 shrink-0 text-muted-foreground" />
                    <span className="truncate">{preset.label}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-2 shrink-0"
                    title={`Preview ${preset.label}`}
                    onClick={() => handlePreview(preset.activity, preset.label)}
                    disabled={isPreviewing}
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Card preview ─────────────────────────────────────────── */}
      {(preview || isPreviewing) && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Card preview
              {preview && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  — {preview.label}
                </span>
              )}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setPreview(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
          {isPreviewing ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.src}
                alt={`Discord card preview: ${preview.label}`}
                className="w-full max-w-2xl rounded-md border"
              />
            )
          )}
          <p className="text-xs text-muted-foreground">
            Rendered by the same pipeline that posts to Discord. Discord shows
            it at roughly this size inside an embed.
          </p>
        </Card>
      )}
    </div>
  );
}
