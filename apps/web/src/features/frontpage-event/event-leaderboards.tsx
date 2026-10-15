import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import React from "react";

import { FrontpageEvent, isFrontpageEventLive } from "@runeprofile/runescape";

import CollectionLogIcon from "~/core/assets/icons/collection-log.png";
import { cn } from "~/shared/utils";

import { PodiumLeaderboard, PodiumTeaser } from "./leaderboard-designs";
import { Board } from "./leaderboard-parts";
import { eventLeaderboardsQueryOptions } from "./queries";

export function EventLeaderboards({
  event,
  className,
}: {
  event: FrontpageEvent;
  className?: string;
}) {
  const [board, setBoard] = React.useState<Board>("clog");

  return (
    <LeaderboardPanel
      event={event}
      board={board}
      onBoardChange={setBoard}
      className={className}
    >
      {isFrontpageEventLive(event) ? (
        <LiveLeaderboard event={event} board={board} />
      ) : (
        <TeaserLeaderboard event={event} board={board} />
      )}
    </LeaderboardPanel>
  );
}

export function LeaderboardPanel({
  event,
  board,
  onBoardChange,
  className,
  children,
}: {
  event: FrontpageEvent;
  board: Board;
  onBoardChange: (board: Board) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-y-2 rounded-2xl bg-background/80 p-2 backdrop-blur-sm",
        className,
      )}
    >
      <p className="pt-1 text-center text-lg font-bold text-secondary-foreground solid-text-shadow">
        {event.name} Leaderboards
      </p>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/40 p-1">
        <BoardTab
          active={board === "clog"}
          onClick={() => onBoardChange("clog")}
        >
          <img src={CollectionLogIcon} alt="" className="size-5" />
          Collection Log
        </BoardTab>
        <BoardTab
          active={board === "purples"}
          onClick={() => onBoardChange("purples")}
        >
          <span className="size-3 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
          Purples
        </BoardTab>
      </div>

      {children}
    </div>
  );
}

function BoardTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-x-2 rounded-lg text-sm font-semibold transition-colors",
        active
          ? "bg-background text-primary shadow"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function LiveLeaderboard({
  event,
  board,
}: {
  event: FrontpageEvent;
  board: Board;
}) {
  const { data } = useQuery(eventLeaderboardsQueryOptions());

  const entries = data?.[board];
  if (!entries) return <div className="flex-1" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-in fade-in duration-700">
      <PodiumLeaderboard event={event} board={board} entries={entries} />
    </div>
  );
}

// The podium's layout with silhouettes and bars where players will be,
// until the item ids are filled in at launch.
export function TeaserLeaderboard({
  event,
  board,
}: {
  event: FrontpageEvent;
  board: Board;
}) {
  return (
    <PodiumTeaser>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-gradient-to-b from-transparent via-background/60 to-transparent px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-primary bg-black/75 shadow">
          <Lock className="size-6 text-primary" />
        </div>
        <p className="text-xl font-bold text-secondary-foreground solid-text-shadow">
          Unlocks when {event.name} launches
        </p>
        <p className="max-w-xs text-sm text-osrs-light-gray drop-shadow-solid-sm">
          {board === "clog"
            ? "The race to collect every purple."
            : "Who will pull the most purples?"}
        </p>
      </div>
    </PodiumTeaser>
  );
}
