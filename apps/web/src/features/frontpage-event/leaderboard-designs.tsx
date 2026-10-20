import { ReactNode } from "react";

import { EventLeaderboardEntry } from "~/core/api";
import { ScrollArea } from "~/shared/components/ui/scroll-area";
import { PlayerPortrait } from "~/shared/model/player-portrait";
import { cn } from "~/shared/utils";

import {
  BoardStat,
  EmptyLeaderboard,
  EntryLink,
  EntryRow,
  LeaderboardDesignProps,
  Username,
} from "./leaderboard-parts";

// Display order, #1 in the middle. The flanking spots turn toward it.
const PODIUM = [
  { rank: 2, color: "#C0C0C0", yaw: 2.8, height: "h-36" },
  { rank: 1, color: "#FFD700", yaw: 3.14, height: "h-44" },
  { rank: 3, color: "#CD7F32", yaw: 3.48, height: "h-32" },
];

type PodiumSpotProps = (typeof PODIUM)[number] &
  Pick<LeaderboardDesignProps, "event" | "board"> & {
    entry: EventLeaderboardEntry;
  };

/** The top three in framed portrait cards with #1 raised, rows for the rest. */
export function PodiumLeaderboard({
  event,
  board,
  entries,
}: LeaderboardDesignProps) {
  if (entries.length === 0) return <EmptyLeaderboard event={event} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-2">
      <div className="grid shrink-0 grid-cols-3 items-end gap-x-2 px-1 pt-2">
        {PODIUM.map((spot) => {
          const entry = entries[spot.rank - 1];
          return entry ? (
            <PodiumCard
              key={spot.rank}
              {...spot}
              event={event}
              board={board}
              entry={entry}
            />
          ) : (
            <div key={spot.rank} />
          );
        })}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-y-1">
          {entries.slice(3).map((entry, index) => (
            <EntryRow
              key={entry.username}
              event={event}
              board={board}
              entry={entry}
              rank={index + 4}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PodiumCard({
  event,
  board,
  entry,
  rank,
  color,
  yaw,
  height,
}: PodiumSpotProps) {
  return (
    <EntryLink
      event={event}
      board={board}
      entry={entry}
      className="group flex min-w-0 flex-col items-center"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#2a1342] to-background/90 transition-transform group-hover:-translate-y-0.5",
          height,
        )}
        style={{
          borderColor: `${color}99`,
          boxShadow: `0 0 18px -6px ${color}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
          style={{
            background: `radial-gradient(closest-side, ${color}33, transparent)`,
          }}
        />
        <PlayerPortrait
          username={entry.username}
          yaw={yaw}
          cropTop={0.5}
          headroomTop={0.1}
          className="absolute inset-0"
        />
      </div>
      <span
        className="z-10 -mt-4 flex size-8 items-center justify-center rounded-full border-2 bg-background font-runescape text-lg font-bold solid-text-shadow"
        style={{ borderColor: color, color }}
      >
        {rank}
      </span>
      <Username
        entry={entry}
        rank={rank}
        className="mt-1 text-lg group-hover:underline"
      />
      <BoardStat event={event} board={board} entry={entry} />
    </EntryLink>
  );
}

// Rough name lengths for the skeleton rows, so they don't look stamped out.
const TEASER_NAME_WIDTHS = [46, 34, 52, 40, 30, 48, 38];

/**
 * The podium before launch: the same frames holding blacked-out silhouettes
 * of the default character, with plain bars where names and stats will be.
 * Children are overlaid on the rows.
 */
export function PodiumTeaser({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-2">
      <div className="grid shrink-0 grid-cols-3 items-end gap-x-2 px-1 pt-2">
        {PODIUM.map((spot) => (
          <div key={spot.rank} className="flex min-w-0 flex-col items-center">
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#2a1342]/60 to-background/50",
                spot.height,
              )}
              style={{ borderColor: `${spot.color}4d` }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
                style={{
                  background: `radial-gradient(closest-side, ${spot.color}2a, transparent)`,
                }}
              />
              <PlayerPortrait
                username={null}
                yaw={spot.yaw}
                cropTop={0.5}
                headroomTop={0.1}
                className="absolute inset-0 opacity-60 brightness-0"
              />
            </div>
            <span
              className="z-10 -mt-4 flex size-8 items-center justify-center rounded-full border-2 bg-background font-runescape text-lg font-bold solid-text-shadow"
              style={{ borderColor: spot.color, color: spot.color }}
            >
              {spot.rank}
            </span>
            <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="mt-1.5 h-3 w-10 animate-pulse rounded-full bg-white/[0.07]" />
          </div>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-y-1">
          {TEASER_NAME_WIDTHS.map((width, index) => (
            <div
              key={index}
              className="flex min-h-12 flex-row items-center gap-x-3 rounded-lg bg-background/45 px-4 py-2"
            >
              <span className="w-7 shrink-0 font-runescape text-xl font-bold text-muted-foreground/60">
                {index + 4}.
              </span>
              <div
                className="h-4 animate-pulse rounded-full bg-white/[0.07]"
                style={{ width: `${width}%` }}
              />
              <div className="ml-auto h-1.5 w-28 animate-pulse rounded-full bg-white/[0.07]" />
            </div>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
