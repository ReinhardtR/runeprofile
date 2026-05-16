import { useVirtualizer } from "@tanstack/react-virtual";
import { FilterIcon } from "lucide-react";
import React from "react";

import {
  COMBAT_ACHIEVEMENT_BOSSES,
  COMBAT_ACHIEVEMENT_BOSS_HISCORE_ICON_MAP,
  COMBAT_ACHIEVEMENT_TASKS,
  COMBAT_ACHIEVEMENT_TASK_TYPES,
  COMBAT_ACHIEVEMENT_TIERS,
  COMBAT_ACHIEVEMENT_TIER_THRESHOLDS,
  decodeCombatAchievements,
  getCombatAchievementTierReached,
} from "@runeprofile/runescape";

import { Profile } from "~/core/api";
import CaMonsterIcons from "~/core/assets/ca-monster-icons.json";
import CombatAchievementTierIcons from "~/core/assets/combat-achievement-tier-icons.json";
import HiscoreIcons from "~/core/assets/hiscore-icons.json";
import CaCollapseHover from "~/core/assets/misc/ca-collapse-hover.png";
import CaCollapse from "~/core/assets/misc/ca-collapse.png";
import CaExpandHover from "~/core/assets/misc/ca-expand-hover.png";
import CaExpand from "~/core/assets/misc/ca-expand.png";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import { Card } from "~/features/profile/components/card";
import { OsrsSelect } from "~/features/profile/components/osrs-select";
import { RuneScapeScrollArea } from "~/features/profile/components/scroll-area";
import { GameIcon } from "~/shared/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { base64ImgSrc, cn } from "~/shared/utils";

// --- Types ---

type CombatAchievementsPanelProps = {
  combatAchievementTiers: Profile["combatAchievementTiers"];
  combatAchievementVarps: Profile["combatAchievementVarps"];
  totalPoints: Profile["totalCombatAchievementPoints"];
  selectedTierId: number;
  onTierChange: (tierId: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  monsterFilter: string;
  onMonsterFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  completionFilter: CompletionFilter;
  onCompletionFilterChange: (value: CompletionFilter) => void;
};

type ViewMode = "tasks" | "bosses";
type CompletionFilter = "all" | "completed" | "incomplete";
type Task = (typeof COMBAT_ACHIEVEMENT_TASKS)[number];

type BossData = {
  name: string;
  tasks: Task[];
  completedCount: number;
  totalCount: number;
};

// --- Constants ---

const TIER_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

const MONSTER_OPTIONS = (() => {
  const monsters = new Set<string>();
  for (const task of COMBAT_ACHIEVEMENT_TASKS) {
    monsters.add(task.monster);
  }
  return [
    { value: "all" as const, label: "All" },
    ...[...monsters].sort().map((m) => ({ value: m, label: m })),
  ];
})();

const TIER_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...COMBAT_ACHIEVEMENT_TIERS.map((t) => ({
    value: String(t.id),
    label: t.name,
  })),
];

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...COMBAT_ACHIEVEMENT_TASK_TYPES.map((t) => ({ value: t, label: t })),
];

const COMPLETION_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "completed", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
] as const;

export function CombatAchievementsPanel({
  combatAchievementTiers,
  combatAchievementVarps,
  totalPoints,
  selectedTierId,
  onTierChange,
  viewMode,
  onViewModeChange,
  monsterFilter,
  onMonsterFilterChange,
  typeFilter,
  onTypeFilterChange,
  completionFilter,
  onCompletionFilterChange,
}: CombatAchievementsPanelProps) {
  const [bossSearch, setBossSearch] = React.useState("");
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const hasCompletedTasks = combatAchievementTiers.some(
    (t) => t.completedCount > 0,
  );
  const hasVarps =
    combatAchievementVarps !== null && combatAchievementVarps !== undefined;
  const showStaleOverlay = hasCompletedTasks && !hasVarps;

  const completedSet = React.useMemo(() => {
    if (!combatAchievementVarps) return new Set<number>();
    return new Set(decodeCombatAchievements(combatAchievementVarps));
  }, [combatAchievementVarps]);

  const allCompleted = completedSet.size >= COMBAT_ACHIEVEMENT_TASKS.length;

  const completedTaskCount = completedSet.size;
  const totalTaskCount = COMBAT_ACHIEVEMENT_TASKS.length;

  const currentPoints = totalPoints ?? 0;

  const tierReached = getCombatAchievementTierReached(currentPoints);
  const tierIcon = tierReached
    ? CombatAchievementTierIcons[
        tierReached as unknown as keyof typeof CombatAchievementTierIcons
      ]
    : CombatAchievementTierIcons[1];

  const maxPoints =
    COMBAT_ACHIEVEMENT_TIER_THRESHOLDS[
      COMBAT_ACHIEVEMENT_TIER_THRESHOLDS.length - 1
    ]?.points ?? 0;
  const pointsPercent =
    maxPoints > 0 ? Math.min(100, (currentPoints / maxPoints) * 100) : 0;

  const nextThreshold = COMBAT_ACHIEVEMENT_TIER_THRESHOLDS.find(
    (t) => t.points > currentPoints,
  );
  const pointsToNext = nextThreshold ? nextThreshold.points - currentPoints : 0;

  const bosses = React.useMemo(() => {
    const bossSet = new Set<string>(COMBAT_ACHIEVEMENT_BOSSES);
    const bossMap = new Map<string, { tasks: Task[] }>();

    for (const task of COMBAT_ACHIEVEMENT_TASKS) {
      if (!bossSet.has(task.monster)) continue;
      const existing = bossMap.get(task.monster);
      if (existing) {
        existing.tasks.push(task);
      } else {
        bossMap.set(task.monster, { tasks: [task] });
      }
    }

    const bossList: BossData[] = [];
    for (const [name, { tasks }] of bossMap) {
      const completedCount = tasks.filter((t) =>
        completedSet.has(t.index),
      ).length;
      bossList.push({ name, tasks, completedCount, totalCount: tasks.length });
    }

    bossList.sort((a, b) => a.name.localeCompare(b.name));

    if (bossSearch.trim()) {
      const query = bossSearch.trim().toLowerCase();
      return bossList.filter((b) => b.name.toLowerCase().includes(query));
    }

    return bossList;
  }, [completedSet, bossSearch]);

  const handleBossClick = React.useCallback(
    (bossName: string) => {
      onMonsterFilterChange(bossName);
      onViewModeChange("tasks");
    },
    [onMonsterFilterChange, onViewModeChange],
  );

  return (
    <Card
      icon={tierIcon ? base64ImgSrc(tierIcon) : undefined}
      className="lg:w-full lg:h-[480px]"
    >
      <div
        className={cn(
          "absolute inset-x-0 -top-[14px] left-[150px] mx-auto w-28 font-runescape text-lg font-bold solid-text-shadow",
          allCompleted
            ? "shimmer-text"
            : completedTaskCount > 0
              ? "text-osrs-orange"
              : "text-osrs-red",
        )}
      >
        {completedTaskCount} / {totalTaskCount}
      </div>

      {showStaleOverlay && (
        <div className="absolute inset-2 z-20 flex items-center justify-center bg-black/90 p-8">
          <p className="max-w-[320px] text-center font-runescape text-[22px] text-osrs-orange solid-text-shadow leading-snug">
            This profile was last updated before individual task tracking was
            added. Update via the RuneLite plugin to view tasks.
          </p>
        </div>
      )}
      <div className="flex h-full w-full flex-col font-runescape text-osrs-orange">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row gap-1.5 mx-1.5 my-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onViewModeChange(viewMode === "tasks" ? "bosses" : "tasks")
              }
              className="h-[28px] shrink-0 bg-black/60 border-2 border-black rounded-sm flex-1 lg:flex-none lg:w-[132px] text-[17px] text-osrs-orange solid-text-shadow leading-none hover:text-osrs-white cursor-pointer"
            >
              {viewMode === "tasks" ? "Boss List" : "Task List"}
            </button>
            {viewMode === "tasks" && (
              <button
                type="button"
                onClick={() => setShowMobileFilters((v) => !v)}
                className={cn(
                  "lg:hidden h-[28px] w-[28px] shrink-0 bg-black/60 border-2 border-black rounded-sm flex items-center justify-center cursor-pointer stroke-osrs-orange hover:stroke-osrs-white",
                )}
                title="Toggle filters"
              >
                <FilterIcon className="size-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            {viewMode === "tasks" ? (
              <PointsBar
                currentPoints={currentPoints}
                pointsPercent={pointsPercent}
                pointsToNext={pointsToNext}
                hasNextThreshold={!!nextThreshold}
              />
            ) : (
              <input
                type="text"
                value={bossSearch}
                onChange={(e) => setBossSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-[28px] bg-black/60 border-2 border-black rounded-sm px-2 text-[17px] text-osrs-white solid-text-shadow leading-none font-runescape placeholder:text-osrs-gray outline-none focus:border-osrs-orange/50"
              />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden border-t border-osrs-border">
          {/* Mobile filters panel */}
          {showMobileFilters && viewMode === "tasks" && (
            <div className="flex lg:hidden flex-1 overflow-auto p-3">
              <div className="flex flex-col gap-3 w-full">
                <div className="text-center font-bold solid-text-shadow leading-none">
                  Filters
                </div>
                <FilterGroup label="Tier:">
                  <OsrsSelect
                    value={
                      selectedTierId === 0 ? "all" : String(selectedTierId)
                    }
                    onValueChange={(val) =>
                      onTierChange(val === "all" ? 0 : Number(val))
                    }
                    options={TIER_FILTER_OPTIONS}
                  />
                </FilterGroup>
                <FilterGroup label="Type:">
                  <OsrsSelect
                    value={typeFilter}
                    onValueChange={(val) => onTypeFilterChange(val)}
                    options={TYPE_FILTER_OPTIONS}
                  />
                </FilterGroup>
                <FilterGroup label="Monster:">
                  <OsrsSelect
                    value={monsterFilter}
                    onValueChange={onMonsterFilterChange}
                    options={MONSTER_OPTIONS}
                  />
                </FilterGroup>
                <FilterGroup label="Completed:">
                  <OsrsSelect
                    value={completionFilter}
                    onValueChange={(val) =>
                      onCompletionFilterChange(val as CompletionFilter)
                    }
                    options={COMPLETION_FILTER_OPTIONS}
                  />
                </FilterGroup>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex flex-1 overflow-hidden",
              viewMode !== "tasks" && "hidden",
              showMobileFilters && "hidden lg:flex",
            )}
          >
            <TasksView
              completedSet={completedSet}
              selectedTierId={selectedTierId}
              onTierChange={onTierChange}
              monsterFilter={monsterFilter}
              onMonsterFilterChange={onMonsterFilterChange}
              typeFilter={typeFilter}
              onTypeFilterChange={onTypeFilterChange}
              completionFilter={completionFilter}
              onCompletionFilterChange={onCompletionFilterChange}
            />
          </div>

          <div
            className={cn(
              "flex flex-1 overflow-hidden",
              viewMode !== "bosses" && "hidden",
            )}
          >
            <BossesGrid
              bosses={bosses}
              onBossClick={handleBossClick}
              allCompleted={allCompleted}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// --- Sub-components ---

function PointsBar({
  currentPoints,
  pointsPercent,
  pointsToNext,
  hasNextThreshold,
}: {
  currentPoints: number;
  pointsPercent: number;
  pointsToNext: number;
  hasNextThreshold: boolean;
}) {
  return (
    <div className="relative h-[28px] border-2 border-black rounded-sm overflow-hidden bg-black/60">
      <div
        className={cn(
          "absolute inset-y-0 left-0",
          !hasNextThreshold && "shimmer-bar-progress",
        )}
        style={{
          width: `${pointsPercent}%`,
          ...(!hasNextThreshold
            ? {}
            : {
                background:
                  "linear-gradient(to bottom, rgb(25,100,25) 0%, rgb(40,155,40) 20%, rgb(65,210,65) 45%, rgb(65,210,65) 55%, rgb(40,155,40) 80%, rgb(25,100,25) 100%)",
              }),
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-lg text-osrs-white solid-text-shadow leading-none z-10">
        <span className="lg:hidden">Total Points: {currentPoints}</span>
        <span className="hidden lg:inline">
          Total Points: {currentPoints}
          {hasNextThreshold
            ? ` \u2013 Next unlock in ${pointsToNext} points`
            : " \u2013 All tiers unlocked!"}
        </span>
      </div>
    </div>
  );
}

function TasksView({
  completedSet,
  selectedTierId,
  onTierChange,
  monsterFilter,
  onMonsterFilterChange,
  typeFilter,
  onTypeFilterChange,
  completionFilter,
  onCompletionFilterChange,
}: {
  completedSet: Set<number>;
  selectedTierId: number;
  onTierChange: (tierId: number) => void;
  monsterFilter: string;
  onMonsterFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  completionFilter: CompletionFilter;
  onCompletionFilterChange: (value: CompletionFilter) => void;
}) {
  const [expandedTask, setExpandedTask] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const tierFilterValue = selectedTierId === 0 ? "all" : String(selectedTierId);

  const filteredTasks = React.useMemo(() => {
    return COMBAT_ACHIEVEMENT_TASKS.filter((task) => {
      if (selectedTierId !== 0 && task.tierId !== selectedTierId) return false;
      if (typeFilter !== "all" && task.type !== typeFilter) return false;
      if (monsterFilter !== "all" && task.monster !== monsterFilter)
        return false;
      if (completionFilter === "completed" && !completedSet.has(task.index))
        return false;
      if (completionFilter === "incomplete" && completedSet.has(task.index))
        return false;
      return true;
    }).sort((a, b) => {
      if (a.tierId !== b.tierId) return a.tierId - b.tierId;
      return a.monster.localeCompare(b.monster);
    });
  }, [
    selectedTierId,
    typeFilter,
    monsterFilter,
    completionFilter,
    completedSet,
  ]);

  const rowVirtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 15,
  });

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [expandedTask, rowVirtualizer]);

  // Re-measure when container resizes (e.g. mobile text wrapping)
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      rowVirtualizer.measure();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      {/* Filters sidebar */}
      <div className="hidden lg:flex w-[140px] shrink-0 border-r border-osrs-border p-1.5 pl-2 flex-col gap-1">
        <div className="text-center font-bold solid-text-shadow leading-none pt-1">
          Filters
        </div>

        <div className="flex flex-col gap-y-4">
          <FilterGroup label="Tier:">
            <OsrsSelect
              value={tierFilterValue}
              onValueChange={(val) =>
                onTierChange(val === "all" ? 0 : Number(val))
              }
              options={TIER_FILTER_OPTIONS}
            />
          </FilterGroup>

          <FilterGroup label="Type:">
            <OsrsSelect
              value={typeFilter}
              onValueChange={(val) => onTypeFilterChange(val)}
              options={TYPE_FILTER_OPTIONS}
            />
          </FilterGroup>

          <FilterGroup label="Monster:">
            <OsrsSelect
              value={monsterFilter}
              onValueChange={onMonsterFilterChange}
              options={MONSTER_OPTIONS}
            />
          </FilterGroup>

          <FilterGroup label="Completed:">
            <OsrsSelect
              value={completionFilter}
              onValueChange={(val) =>
                onCompletionFilterChange(val as CompletionFilter)
              }
              options={COMPLETION_FILTER_OPTIONS}
            />
          </FilterGroup>
        </div>
      </div>

      {/* Virtualized task list */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <RuneScapeScrollArea
          className="h-full"
          contentClassName="flex flex-col"
          scrollRef={scrollRef}
        >
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-osrs-gray text-lg solid-text-shadow">
              No tasks found
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {filteredTasks.map((task, index) => (
                <TaskRow
                  key={task.index}
                  task={task}
                  virtualIndex={index}
                  measureRef={() => {}}
                  isCompleted={completedSet.has(task.index)}
                  isExpanded={expandedTask === task.index}
                  onToggle={() =>
                    setExpandedTask(
                      expandedTask === task.index ? null : task.index,
                    )
                  }
                />
              ))}
            </div>
          )}
        </RuneScapeScrollArea>
      </div>
    </>
  );
}

function TaskRow({
  task,
  virtualIndex,
  measureRef,
  isCompleted,
  isExpanded,
  onToggle,
}: {
  task: Task;
  virtualIndex: number;
  measureRef: (node: HTMLElement | null) => void;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const tierIcon =
    CombatAchievementTierIcons[
      task.tierId as unknown as keyof typeof CombatAchievementTierIcons
    ];
  const points = TIER_POINTS[task.tierId] ?? 0;

  return (
    <div
      data-index={virtualIndex}
      ref={measureRef}
      className={cn(
        "group border-b border-osrs-border/30 cursor-pointer hover:bg-white/10",
        virtualIndex % 2 === 0 && "bg-white/[0.03]",
        isExpanded && "bg-white/[0.08]",
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-x-2 gap-y-2 w-full px-1.5 py-1 text-left">
        <div className="shrink-0 size-[18px] mr-0.5 ml-1 relative">
          <img
            src={isExpanded ? CaCollapse : CaExpand}
            alt=""
            className="absolute inset-0 size-full object-contain group-hover:hidden"
            style={{ imageRendering: "pixelated" }}
          />
          <img
            src={isExpanded ? CaCollapseHover : CaExpandHover}
            alt=""
            className="absolute inset-0 size-full object-contain hidden group-hover:block"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <GameIcon src={tierIcon} alt="" size={32} className="shrink-0" />
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-[19px] leading-tight solid-text-shadow",
              isCompleted ? "text-osrs-green" : "text-osrs-light-gray",
            )}
          >
            {task.name}
          </span>
          <span className="text-[16px] solid-text-shadow leading-tight">
            <span className="text-osrs-orange">Monster:</span>{" "}
            <span className="text-osrs-white">{task.monster}</span>
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-2 pb-1.5 flex flex-col gap-0.5">
          <p className="text-[17px] solid-text-shadow leading-snug">
            <span className="text-osrs-orange">Type: </span>
            <span className="text-osrs-white">
              {task.type} (+{points} {points === 1 ? "point" : "points"})
            </span>
          </p>
          <p className="text-[17px] solid-text-shadow leading-snug">
            <span className="text-osrs-orange">Description: </span>
            <span className="text-osrs-white">{task.description}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function BossesGrid({
  bosses,
  onBossClick,
  allCompleted,
}: {
  bosses: BossData[];
  onBossClick: (bossName: string) => void;
  allCompleted: boolean;
}) {
  return (
    <RuneScapeScrollArea
      className="h-full w-full"
      contentClassName="grid grid-cols-2 lg:grid-cols-6 gap-1 p-1.5"
    >
      {bosses.length === 0 ? (
        <div className="col-span-2 lg:col-span-6 flex items-center justify-center h-20 text-osrs-gray text-lg solid-text-shadow">
          No bosses found
        </div>
      ) : (
        bosses.map((boss) => (
          <BossCard
            key={boss.name}
            boss={boss}
            onClick={onBossClick}
            allCompleted={allCompleted}
          />
        ))
      )}
    </RuneScapeScrollArea>
  );
}

function BossCard({
  boss,
  onClick,
  allCompleted,
}: {
  boss: BossData;
  onClick: (bossName: string) => void;
  allCompleted: boolean;
}) {
  const pct = Math.floor((boss.completedCount / boss.totalCount) * 100);
  const isComplete = boss.completedCount === boss.totalCount;
  const hasProgress = boss.completedCount > 0;
  const iconKey =
    COMBAT_ACHIEVEMENT_BOSS_HISCORE_ICON_MAP[boss.name] ?? boss.name;

  // some bosses don't have an hiscores icon, so we have a map of ca specific icons for those.
  const iconBase64 =
    CaMonsterIcons[boss.name as keyof typeof CaMonsterIcons] ??
    HiscoreIcons[iconKey as keyof typeof HiscoreIcons] ??
    null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onClick(boss.name)}
          className="runescape-corners-border flex aspect-square flex-col items-center justify-center gap-1.5 bg-white/3 cursor-pointer hover:bg-white/8 transition-colors"
        >
          {iconBase64 ? (
            <GameIcon
              src={iconBase64}
              alt={boss.name}
              size={40}
              className="drop-shadow-solid-sm"
            />
          ) : (
            <GameIcon
              src={QuestionMarkImage}
              alt={boss.name}
              size={40}
              isBase64={false}
              pixelated={false}
            />
          )}
          <div className="relative w-full h-[10px] rounded-none border-2 border-black shadow">
            <div className="absolute left-1/4 z-20 h-full border-l-2 border-black" />
            <div className="absolute left-1/2 z-20 h-full border-l-2 border-black" />
            <div className="absolute left-3/4 z-20 h-full border-l-2 border-black" />
            <div
              className={cn(
                "h-full",
                allCompleted
                  ? "shimmer-bar"
                  : isComplete
                    ? "bg-osrs-green"
                    : hasProgress
                      ? "bg-osrs-yellow"
                      : "bg-transparent",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-bold">{boss.name}</p>
        <p className="text-muted-foreground">
          {boss.completedCount}/{boss.totalCount} tasks
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[15px] solid-text-shadow leading-none">
        {label}
      </span>
      {children}
    </div>
  );
}
