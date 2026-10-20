import { ReactNode } from "react";

import { EventLeaderboardEntry } from "~/core/api";
import { PlayerPortrait } from "~/shared/model/player-portrait";
import { cn } from "~/shared/utils";

import {
  BoardStat,
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

type PodiumSpot = (typeof PODIUM)[number];

// Ranks 4-10 below the podium. Rough name lengths for their placeholders, so
// the bars don't look stamped out.
const ROW_PLACEHOLDER_WIDTHS = [46, 34, 52, 40, 30, 48, 38];

/**
 * The top three in framed portrait cards with #1 raised, rows for the rest.
 * Every rank keeps its placeholder until someone takes it, so the board fills
 * in as players log drops; an empty board says so over the rows.
 */
export function PodiumLeaderboard({
  event,
  board,
  entries,
}: LeaderboardDesignProps) {
  return (
    <PodiumLayout
      spot={(spot) => {
        const entry = entries[spot.rank - 1];
        return entry ? (
          <PodiumCard {...spot} event={event} board={board} entry={entry} />
        ) : (
          <PlaceholderSpot {...spot} />
        );
      }}
      row={(index) => {
        const entry = entries[index + 3];
        return entry ? (
          <div className="animate-in fade-in duration-700">
            <EntryRow
              event={event}
              board={board}
              entry={entry}
              rank={index + 4}
            />
          </div>
        ) : (
          <PlaceholderRow index={index} />
        );
      }}
    >
      {entries.length === 0 && (
        <RowsMessage>
          <p className="text-xl font-bold text-secondary-foreground solid-text-shadow">
            Nobody's on the board yet
          </p>
          <p className="max-w-xs text-sm text-osrs-light-gray drop-shadow-solid-sm">
            The first {event.name} drops will take these spots.
          </p>
        </RowsMessage>
      )}
    </PodiumLayout>
  );
}

/**
 * The podium before launch: every spot a placeholder. Children are overlaid
 * on the rows.
 */
export function PodiumTeaser({ children }: { children?: ReactNode }) {
  return (
    <PodiumLayout
      spot={(spot) => <PlaceholderSpot {...spot} />}
      row={(index) => <PlaceholderRow index={index} />}
    >
      {children}
    </PodiumLayout>
  );
}

/** Centered text over the rows, on a fade so it reads over the bars. */
export function RowsMessage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 bg-gradient-to-b from-transparent via-background/60 to-transparent px-6 text-center">
      {children}
    </div>
  );
}

function PodiumLayout({
  spot,
  row,
  children,
}: {
  spot: (spot: PodiumSpot) => ReactNode;
  row: (index: number) => ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-2">
      <div className="grid shrink-0 grid-cols-3 items-end gap-x-2 px-1 pt-2">
        {PODIUM.map((podiumSpot) => (
          <div key={podiumSpot.rank} className="flex min-w-0 flex-col">
            {spot(podiumSpot)}
          </div>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-y-1">
          {ROW_PLACEHOLDER_WIDTHS.map((_, index) => (
            <div key={index}>{row(index)}</div>
          ))}
        </div>
        {children}
      </div>
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
}: PodiumSpot &
  Pick<LeaderboardDesignProps, "event" | "board"> & {
    entry: EventLeaderboardEntry;
  }) {
  return (
    <EntryLink
      event={event}
      board={board}
      entry={entry}
      className="group flex min-w-0 flex-col items-center animate-in fade-in duration-700"
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
        <SpotGlow color={color} strength="33" />
        <PlayerPortrait
          username={entry.username}
          yaw={yaw}
          cropTop={0.5}
          headroomTop={0.1}
          className="absolute inset-0"
        />
      </div>
      <RankBadge rank={rank} color={color} />
      <Username
        entry={entry}
        rank={rank}
        className="mt-1 text-lg group-hover:underline"
      />
      <BoardStat event={event} board={board} entry={entry} />
    </EntryLink>
  );
}

// A blacked-out silhouette of the default character in the spot's frame,
// with bars where the name and stat will be.
function PlaceholderSpot({ rank, color, yaw, height }: PodiumSpot) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#2a1342]/60 to-background/50",
          height,
        )}
        style={{ borderColor: `${color}4d` }}
      >
        <SpotGlow color={color} strength="2a" />
        <PlayerPortrait
          username={null}
          yaw={yaw}
          cropTop={0.5}
          headroomTop={0.1}
          className="absolute inset-0 opacity-60 brightness-0"
        />
      </div>
      <RankBadge rank={rank} color={color} />
      <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-white/[0.07]" />
      <div className="mt-1.5 h-3 w-10 animate-pulse rounded-full bg-white/[0.07]" />
    </div>
  );
}

function PlaceholderRow({ index }: { index: number }) {
  return (
    <div className="flex min-h-12 flex-row items-center gap-x-3 rounded-lg bg-background/45 px-4 py-2">
      <span className="w-7 shrink-0 font-runescape text-xl font-bold text-muted-foreground/60">
        {index + 4}.
      </span>
      <div
        className="h-4 animate-pulse rounded-full bg-white/[0.07]"
        style={{ width: `${ROW_PLACEHOLDER_WIDTHS[index]}%` }}
      />
      <div className="ml-auto h-1.5 w-28 animate-pulse rounded-full bg-white/[0.07]" />
    </div>
  );
}

function SpotGlow({ color, strength }: { color: string; strength: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
      style={{
        background: `radial-gradient(closest-side, ${color}${strength}, transparent)`,
      }}
    />
  );
}

function RankBadge({ rank, color }: { rank: number; color: string }) {
  return (
    <span
      className="z-10 -mt-4 flex size-8 items-center justify-center rounded-full border-2 bg-background font-runescape text-lg font-bold solid-text-shadow"
      style={{ borderColor: color, color }}
    >
      {rank}
    </span>
  );
}
