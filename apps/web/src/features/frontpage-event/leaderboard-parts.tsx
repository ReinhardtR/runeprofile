import { Link } from "@tanstack/react-router";
import React from "react";

import { COLLECTION_LOG_ITEMS, FrontpageEvent } from "@runeprofile/runescape";

import { EventLeaderboardEntry } from "~/core/api";
import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import { GameIcon } from "~/shared/components/icons";
import { ItemIcon } from "~/shared/components/item-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { cn } from "~/shared/utils";

// "clog" is the race to collect every purple, "purples" the most collected.
export type Board = "clog" | "purples";

export type LeaderboardDesignProps = {
  event: FrontpageEvent;
  board: Board;
  entries: EventLeaderboardEntry[];
};

export const PODIUM_COLORS = [
  "text-[#FFD700]",
  "text-[#C0C0C0]",
  "text-[#CD7F32]",
];

export function Username({
  entry,
  rank,
  className,
}: {
  entry: EventLeaderboardEntry;
  rank: number;
  className?: string;
}) {
  const accountTypeIcon =
    AccountTypeIcons[entry.accountType.key as keyof typeof AccountTypeIcons];

  return (
    <span className="flex min-w-0 flex-row items-center gap-x-2">
      {!!accountTypeIcon && (
        <GameIcon
          src={accountTypeIcon}
          alt={entry.accountType.name}
          size={18}
          className="shrink-0 drop-shadow-solid"
        />
      )}
      <span
        className={cn(
          "truncate font-runescape text-2xl font-bold solid-text-shadow",
          PODIUM_COLORS[rank - 1],
          className,
        )}
      >
        {entry.username}
      </span>
    </span>
  );
}

export function ProgressBar({
  obtained,
  total,
  className,
}: {
  obtained: number;
  total: number;
  className?: string;
}) {
  const isComplete = total > 0 && obtained >= total;

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-black/60",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full",
          isComplete ? "bg-osrs-green" : "bg-[#A855F7]",
        )}
        style={{ width: `${total ? (obtained / total) * 100 : 0}%` }}
      />
    </div>
  );
}

// The items a board ranks by: the clog set for the race, the purples for
// the most collected.
export function boardItemIds(event: FrontpageEvent, board: Board) {
  return board === "clog" ? event.clogItemIds : event.purpleItemIds;
}

// The number a board ranks by: unique items out of the clog set, or the
// total purples.
export function BoardStat({
  event,
  board,
  entry,
  className,
}: {
  event: FrontpageEvent;
  board: Board;
  entry: EventLeaderboardEntry;
  className?: string;
}) {
  const total = boardItemIds(event, board).length;
  const isComplete = board === "clog" && entry.obtained >= total;

  return (
    <span
      className={cn(
        "font-runescape text-lg leading-none solid-text-shadow",
        isComplete ? "text-osrs-green" : "text-[#C084FC]",
        className,
      )}
    >
      {board === "clog"
        ? `${entry.obtained}/${total}`
        : `${entry.quantity} ${entry.quantity === 1 ? "purple" : "purples"}`}
    </span>
  );
}

// Links the wrapped element to the player's profile and shows the board's
// items they have on hover.
export function EntryLink({
  event,
  board,
  entry,
  className,
  children,
}: {
  event: FrontpageEvent;
  board: Board;
  entry: EventLeaderboardEntry;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Link
          to="/$username"
          params={{ username: entry.username }}
          className={className}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="left" className="p-3">
        <EntryItems event={event} board={board} entry={entry} />
      </TooltipContent>
    </Tooltip>
  );
}

function EntryItems({
  event,
  board,
  entry,
}: {
  event: FrontpageEvent;
  board: Board;
  entry: EventLeaderboardEntry;
}) {
  const quantities = new Map(
    entry.items.map((item) => [item.id, item.quantity]),
  );
  const itemIds = boardItemIds(event, board);
  const total = itemIds.length;

  return (
    <div className="flex w-64 flex-col gap-y-2">
      <div className="flex flex-row items-baseline justify-between gap-x-4">
        <span className="truncate font-runescape text-xl text-osrs-white solid-text-shadow">
          {entry.username}
        </span>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {entry.obtained}/{total} unique · {entry.quantity} total
        </span>
      </div>
      <ProgressBar obtained={entry.obtained} total={total} />
      <div className="grid grid-cols-6 gap-1 rounded-md bg-black/40 p-1.5">
        {itemIds.map((id) => {
          const quantity = quantities.get(id) ?? 0;
          return (
            <div
              key={id}
              className="relative flex items-center justify-center"
              title={COLLECTION_LOG_ITEMS[id]}
            >
              {quantity > 1 && (
                <p className="absolute -top-0.5 left-0 z-20 font-runescape text-sm text-osrs-yellow solid-text-shadow">
                  {quantity}
                </p>
              )}
              <ItemIcon
                id={id}
                alt={COLLECTION_LOG_ITEMS[id] ?? "Unknown"}
                size={34}
                className={cn("drop-shadow-2xl", !quantity && "opacity-20")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A ranked row for everyone below the featured spots.
export function EntryRow({
  event,
  board,
  entry,
  rank,
}: {
  event: FrontpageEvent;
  board: Board;
  entry: EventLeaderboardEntry;
  rank: number;
}) {
  const total = boardItemIds(event, board).length;

  return (
    <EntryLink
      event={event}
      board={board}
      entry={entry}
      className="flex min-h-12 flex-row items-center gap-x-3 rounded-lg bg-background/80 px-4 py-2 shadow transition-colors hover:bg-background"
    >
      <span
        className={cn(
          "w-7 shrink-0 font-runescape text-xl font-bold",
          PODIUM_COLORS[rank - 1],
        )}
      >
        {rank}.
      </span>
      <Username entry={entry} rank={rank} />
      <div className="ml-auto flex w-28 shrink-0 flex-col items-end gap-y-1">
        <BoardStat event={event} board={board} entry={entry} />
        {board === "clog" && (
          <ProgressBar obtained={entry.obtained} total={total} />
        )}
      </div>
    </EntryLink>
  );
}
