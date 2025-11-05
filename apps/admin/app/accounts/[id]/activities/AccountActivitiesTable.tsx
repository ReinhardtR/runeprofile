"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  ActivityEvent,
  COLLECTION_LOG_ITEMS,
  getAchievementDiaryById,
  getCombatAchievementTierName,
  getQuestById,
  getQuestStateFromIndex,
} from "@runeprofile/runescape";

import { AddActivityDialog } from "./AddActivityDialog";
import { EditActivityDialog } from "./EditActivityDialog";
import { deleteAccountActivities } from "./actions";

type Activity = {
  id: string;
  type: ActivityEvent["type"];
  data: ActivityEvent["data"];
  createdAt: string;
};

interface AccountActivitiesTableProps {
  accountId: string;
  activities: Activity[];
  currentPage: number;
}

export function AccountActivitiesTable({
  accountId,
  activities,
  currentPage,
}: AccountActivitiesTableProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const toggleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map((a) => a.id));
    }
    setLastSelectedIndex(null);
  };

  const toggleSelectActivity = (
    activityId: string,
    event?: React.MouseEvent,
  ) => {
    const currentIndex = activities.findIndex((a) => a.id === activityId);

    if (event?.shiftKey && lastSelectedIndex !== null) {
      // Shift-click: select range
      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = activities
        .slice(startIndex, endIndex + 1)
        .map((a) => a.id);

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        rangeIds.forEach((id) => newSelected.add(id));
        return Array.from(newSelected);
      });
    } else {
      // Normal click: toggle single item
      setSelectedIds((prev) =>
        prev.includes(activityId)
          ? prev.filter((id) => id !== activityId)
          : [...prev, activityId],
      );
    }

    setLastSelectedIndex(currentIndex);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        const result = await deleteAccountActivities(accountId, selectedIds);
        toast.success(`Successfully deleted ${result.deleted} activities`);
        setSelectedIds([]);

        // Refresh the page to show updated results
        const url = new URL(
          window.location.origin +
            `/accounts/${encodeURIComponent(accountId)}/activities`,
        );
        url.searchParams.set("page", currentPage.toString());
        if (from) url.searchParams.set("from", from);
        window.location.href = url.toString();
      } catch (error) {
        toast.error("Failed to delete activities");
        console.error(error);
      }
    });
  };

  const formatActivityData = (type: string, data: ActivityEvent["data"]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyData = data as any;

      switch (type) {
        case "level_up":
          return `${anyData.name} → Level ${anyData.level}`;
        case "new_item_obtained":
          return (
            <div className="flex items-center gap-2">
              {anyData.itemId && (
                <Image
                  src={`https://static.runelite.net/cache/item/icon/${anyData.itemId}.png`}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <span className="font-medium">
                  {anyData.itemId
                    ? COLLECTION_LOG_ITEMS[anyData.itemId] ||
                      anyData.item?.name ||
                      "Unknown Item"
                    : anyData.item?.name || "Unknown Item"}
                </span>
                {anyData.quantity > 1 && (
                  <span className="text-muted-foreground">
                    {" "}
                    (×{anyData.quantity})
                  </span>
                )}
                {anyData.itemId && (
                  <div className="text-xs text-muted-foreground">
                    ID: {anyData.itemId}
                  </div>
                )}
              </div>
            </div>
          );
        case "quest_completed":
          const quest = anyData.questId ? getQuestById(anyData.questId) : null;
          return (
            <div>
              <span className="font-medium">
                {quest?.name || anyData.quest?.name || "Unknown Quest"}
              </span>
              {anyData.questId && (
                <div className="text-xs text-muted-foreground">
                  Quest ID: {anyData.questId}
                </div>
              )}
            </div>
          );
        case "achievement_diary_tier_completed":
          const diary = anyData.areaId
            ? getAchievementDiaryById(anyData.areaId)
            : null;
          return (
            <div>
              <span className="font-medium">
                {diary?.name || anyData.diary?.name || "Unknown Diary"}
              </span>
              <span className="text-muted-foreground"> - {anyData.tier}</span>
              {anyData.areaId && (
                <div className="text-xs text-muted-foreground">
                  Area ID: {anyData.areaId}
                </div>
              )}
            </div>
          );
        case "combat_achievement_tier_completed":
          const tierName = anyData.tier
            ? getCombatAchievementTierName(anyData.tier)
            : null;
          return (
            <div>
              <span className="font-medium">Combat Achievement</span>
              <span className="text-muted-foreground">
                {" "}
                - {tierName || anyData.tier || "Unknown Tier"}
              </span>
              {anyData.tier && (
                <div className="text-xs text-muted-foreground">
                  Tier: {anyData.tier}
                </div>
              )}
            </div>
          );
        case "xp_milestone":
          return `${anyData.name} → ${anyData.xp?.toLocaleString()} XP`;
        case "valuable_drop":
          return (
            <div className="flex items-center gap-2">
              {anyData.itemId && (
                <Image
                  src={`https://static.runelite.net/cache/item/icon/${anyData.itemId}.png`}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <span className="font-medium">
                  {anyData.itemId
                    ? COLLECTION_LOG_ITEMS[anyData.itemId] || "Unknown Item"
                    : anyData.item?.name || "Unknown Item"}
                </span>
                <span className="text-green-600 font-medium">
                  {" "}
                  ({anyData.value?.toLocaleString()} gp)
                </span>
                {anyData.itemId && (
                  <div className="text-xs text-muted-foreground">
                    ID: {anyData.itemId}
                  </div>
                )}
              </div>
            </div>
          );
        case "quest_state_changed":
          const questData = anyData.questId
            ? getQuestById(anyData.questId)
            : null;
          const stateName =
            anyData.state !== undefined
              ? getQuestStateFromIndex(anyData.state)
              : null;
          return (
            <div>
              <span className="font-medium">
                {questData?.name || anyData.quest?.name || "Unknown Quest"}
              </span>
              <span className="text-muted-foreground">
                {" "}
                → {stateName || `State ${anyData.state}`}
              </span>
              {anyData.questId && (
                <div className="text-xs text-muted-foreground">
                  Quest ID: {anyData.questId}
                </div>
              )}
            </div>
          );
        case "maxed":
          return "Account Maxed!";
        default:
          // Try to format unknown activity types more nicely
          if (anyData && typeof anyData === "object") {
            const keys = Object.keys(anyData);
            if (keys.length > 0) {
              return (
                <div>
                  <span className="font-medium">{type.replace(/_/g, " ")}</span>
                  <div className="text-xs text-muted-foreground space-y-1 mt-1">
                    {keys.slice(0, 3).map((key) => (
                      <div key={key}>
                        {key}: {String(anyData[key]).substring(0, 50)}
                        {String(anyData[key]).length > 50 && "..."}
                      </div>
                    ))}
                    {keys.length > 3 && (
                      <div>... and {keys.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            }
          }
          return JSON.stringify(data).substring(0, 100) + "...";
      }
    } catch {
      return "Invalid data";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      level_up: "bg-blue-100 text-blue-800",
      new_item_obtained: "bg-green-100 text-green-800",
      quest_completed: "bg-purple-100 text-purple-800",
      quest_state_changed: "bg-purple-50 text-purple-700",
      achievement_diary_tier_completed: "bg-yellow-100 text-yellow-800",
      combat_achievement_tier_completed: "bg-red-100 text-red-800",
      xp_milestone: "bg-indigo-100 text-indigo-800",
      valuable_drop: "bg-orange-100 text-orange-800",
      maxed: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (activities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No activities to display.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isPending}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Activities</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedIds.length} selected
                  activities? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSelected}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Activities table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Hold Shift and click to select a range of activities
          </p>
          <AddActivityDialog accountId={accountId} />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      activities.length > 0 &&
                      selectedIds.length === activities.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div
                      onClick={(e) => toggleSelectActivity(activity.id, e)}
                      className="cursor-pointer select-none p-1 rounded hover:bg-muted/50"
                      title="Click to select, Shift+click to select range"
                    >
                      <Checkbox
                        checked={selectedIds.includes(activity.id)}
                        onCheckedChange={() => {}} // Handled by div onClick
                        aria-label={`Select activity ${activity.id}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getTypeColor(activity.type)}
                    >
                      {activity.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div
                      className={
                        activity.type === "new_item_obtained" ||
                        activity.type === "valuable_drop"
                          ? ""
                          : "truncate"
                      }
                    >
                      {formatActivityData(activity.type, activity.data)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(activity.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {activity.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <EditActivityDialog
                      accountId={accountId}
                      activity={{
                        id: activity.id,
                        type: activity.type,
                        data: activity.data,
                        createdAt: activity.createdAt,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
