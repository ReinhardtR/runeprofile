import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

import { FrontpageEvent } from "@runeprofile/runescape";

import { EventLeaderboardEntry } from "~/core/api";
import EventHeroImage from "~/core/assets/misc/fractured-archive-hero.webp";
import {
  LeaderboardPanel,
  TeaserLeaderboard,
} from "~/features/frontpage-event/event-leaderboards";
import { PodiumLeaderboard } from "~/features/frontpage-event/leaderboard-designs";
import { Board } from "~/features/frontpage-event/leaderboard-parts";
import { cn } from "~/shared/utils";

// Dev-only preview of the event leaderboard's live and teaser states with
// mock data, for checking the design before launch.
export const Route = createFileRoute("/dev/event-leaderboard")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: RouteComponent,
});

// Chambers of Xeric purples stand in for the Raids 4 ones.
const MOCK_EVENT: FrontpageEvent = {
  name: "Raids 4",
  purpleItemIds: [
    21034, 21079, 20997, 21003, 21043, 13652, 21018, 21021, 21024, 21015, 21000,
    21012,
  ],
  launchesAt: null,
  trailerUrl: null,
  backgroundVideo: null,
};

const ACCOUNT_TYPES = [
  { id: 0, key: "normal", name: "Normal" },
  { id: 1, key: "ironman", name: "Ironman" },
  { id: 2, key: "ultimate_ironman", name: "Ultimate Ironman" },
  { id: 3, key: "hardcore_ironman", name: "Hardcore Ironman" },
] as const;

// [username, account type, owned purple indexes with quantities]
const MOCK_PLAYERS: [string, number, Record<number, number>][] = [
  [
    "Pgn",
    0,
    { 0: 2, 1: 1, 2: 1, 3: 1, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1, 10: 2 },
  ],
  [
    "Lynx Titan",
    0,
    { 0: 4, 1: 3, 2: 1, 4: 1, 5: 1, 6: 2, 7: 1, 8: 1, 10: 1, 11: 1 },
  ],
  ["Zezima", 1, { 0: 1, 1: 1, 2: 1, 3: 1, 5: 1, 6: 1, 7: 1, 8: 1, 11: 1 }],
  ["B0aty", 1, { 0: 2, 1: 6, 5: 1, 9: 1, 10: 1, 11: 2 }],
  ["Woox", 0, { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }],
  ["Framed", 3, { 0: 3, 1: 2, 10: 1, 11: 1, 9: 1 }],
  ["Odablock", 0, { 0: 1, 1: 1, 4: 1, 5: 1 }],
  ["Settled", 2, { 0: 5, 1: 2, 11: 1 }],
  ["Mammal", 1, { 1: 1, 9: 1, 10: 1 }],
  ["Coxie", 0, { 0: 1, 1: 1 }],
];

const MOCK_ENTRIES: EventLeaderboardEntry[] = MOCK_PLAYERS.map(
  ([username, type, owned]) => {
    const items = Object.entries(owned).map(([index, quantity]) => ({
      id: MOCK_EVENT.purpleItemIds[Number(index)]!,
      quantity,
    }));
    return {
      username,
      accountType: ACCOUNT_TYPES[type]!,
      obtained: items.length,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
    } as EventLeaderboardEntry;
  },
);

const MOCK_BOARDS: Record<Board, EventLeaderboardEntry[]> = {
  clog: [...MOCK_ENTRIES].sort((a, b) => b.obtained - a.obtained),
  purples: [...MOCK_ENTRIES].sort((a, b) => b.quantity - a.quantity),
};

const VIEWS: { key: "live" | "teaser"; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "teaser", label: "Teaser" },
];

function RouteComponent() {
  const [view, setView] = React.useState<"live" | "teaser">("live");
  const [board, setBoard] = React.useState<Board>("clog");
  const [isEmpty, setIsEmpty] = React.useState(false);

  const entries = isEmpty ? [] : MOCK_BOARDS[board];

  return (
    <div className="relative flex min-h-[max(100vh,700px)] flex-col">
      <div className="absolute inset-0">
        <img src={EventHeroImage} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/10 to-background/40" />
      </div>

      <div className="relative flex flex-1 flex-row gap-4 p-4">
        <div className="flex flex-1 flex-col gap-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Leaderboard preview
          </p>
          {VIEWS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setView(option.key)}
              className={cn(
                "w-fit rounded-xl border bg-black/75 px-4 py-2 font-semibold",
                view === option.key
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
          <label className="mt-2 flex w-fit items-center gap-x-2 rounded-xl bg-black/75 px-4 py-2 text-sm">
            <input
              type="checkbox"
              checked={isEmpty}
              onChange={(e) => setIsEmpty(e.target.checked)}
            />
            No entries yet
          </label>
        </div>

        <div className="relative w-[520px]">
          <LeaderboardPanel
            event={MOCK_EVENT}
            board={board}
            onBoardChange={setBoard}
            className="absolute inset-0"
          >
            {view === "live" ? (
              <PodiumLeaderboard
                event={MOCK_EVENT}
                board={board}
                entries={entries}
              />
            ) : (
              <TeaserLeaderboard event={MOCK_EVENT} board={board} />
            )}
          </LeaderboardPanel>
        </div>
      </div>
    </div>
  );
}
