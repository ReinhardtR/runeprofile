"use client";

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
import { Loader2, Search, Send } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import { DynamicActivityForm } from "@/app/accounts/[id]/activities/DynamicActivityForm";

import {
  ActivityEvent,
  AccountTypes,
  COLLECTION_LOG_ITEMS,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import {
  getRecentActivities,
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
    case "maxed":
      return "Maxed!";
    default:
      return activity.type;
  }
}

export function DiscordSimulatorClient({
  defaultChannelId,
}: {
  defaultChannelId: string;
}) {
  const [channelId, setChannelId] = useState(defaultChannelId);

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
        });
        toast.success(`Sent ${result.sent} embed(s) to Discord`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send embeds",
        );
      }
    });
  }, [
    selectedAccount,
    selectedActivityIds,
    accountActivities,
    channelId,
  ]);

  const handleSendManual = useCallback(
    async (activityData: ActivityEvent) => {
      startSendTransition(async () => {
        try {
          const result = await sendDiscordEmbeds({
            channelId,
            activities: [activityData],
            rsn: manualRsn || "TestPlayer",
            accountType: Number(manualAccountType),
          });
          toast.success(`Sent ${result.sent} embed(s) to Discord`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to send embeds",
          );
        }
      });
    },
    [channelId, manualRsn, manualAccountType],
  );

  const getActivityTypeLabel = (type: string) =>
    type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="space-y-6">
      {/* Channel ID */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label htmlFor="channel-id">Discord Channel ID</Label>
          <Input
            id="channel-id"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Paste a Discord channel ID"
            className="max-w-md font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Right-click a channel in Discord → Copy Channel ID. Overrides the
            default from your environment.
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="from-account">
        <TabsList>
          <TabsTrigger value="from-account">From Account</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
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
                    Send {selectedActivityIds.size > 0 &&
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
      </Tabs>
    </div>
  );
}
