import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Bot, Play, Search } from "lucide-react";
import React from "react";

import { FrontpageEvent, isFrontpageEventLive } from "@runeprofile/runescape";

// Upscaled from the trailer thumbnail; shown when the video can't play.
import EventHeroImage from "~/core/assets/misc/fractured-archive-hero.webp";
// The trailer footage (0:13-1:46, no intro/outro black), upscaled to 1440p
// with Real-ESRGAN, muted, as AV1 with an H.264 fallback.
import EventLoopAv1 from "~/core/assets/misc/fractured-archive-loop-av1.mp4";
import EventLoopH264 from "~/core/assets/misc/fractured-archive-loop-h264.mp4";
import Logo from "~/core/assets/misc/logo.png";
import RuneLiteLogo from "~/core/assets/misc/runelite-logo.png";
import { isSearchDialogOpenAtom } from "~/features/search";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import { cn, numberWithDelimiter } from "~/shared/utils";

import { EventLeaderboards } from "./event-leaderboards";
import { metricsQueryOptions } from "./queries";
import { VideoBackground } from "./video-background";

export function EventHero({ event }: { event: FrontpageEvent }) {
  const setIsSearchDialogOpen = useSetAtom(isSearchDialogOpenAtom);

  const { data: metrics } = useQuery(metricsQueryOptions());

  const isLive = isFrontpageEventLive(event);

  return (
    <div className="flex flex-1 flex-col">
      {/* The art runs edge to edge behind everything. */}
      <div className="absolute inset-0 z-20 overflow-hidden">
        <VideoBackground
          sources={[
            { src: EventLoopAv1, type: 'video/mp4; codecs="av01.0.08M.08"' },
            { src: EventLoopH264, type: "video/mp4" },
          ]}
          poster={EventHeroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent via-30% to-transparent" />
      </div>

      <div className="z-30 flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="flex flex-1 flex-col justify-between gap-y-8">
          <Link
            to="/"
            className="flex w-fit items-center space-x-2 rounded-3xl bg-background/80 p-4"
          >
            <img
              src={Logo}
              alt="Logo"
              width={50}
              height={50}
              className="drop-shadow"
            />
            <p className="flex flex-col text-2xl font-black leading-none tracking-wide drop-shadow">
              <span className="text-primary">RUNE</span>
              <span className="text-secondary-foreground">PROFILE</span>
            </p>
          </Link>

          <div className="flex flex-col gap-y-4">
            <div className="flex flex-row flex-wrap items-stretch gap-4">
              <div
                className={cn(
                  "flex w-fit flex-row items-center gap-x-6 rounded-3xl bg-background/80 px-6 py-3 transition-opacity duration-700",
                  metrics
                    ? "opacity-100 animate-in fade-in"
                    : "pointer-events-none opacity-0",
                )}
              >
                <div className="flex flex-col gap-y-1">
                  <p className="text-3xl font-bold text-secondary-foreground solid-text-shadow">
                    {numberWithDelimiter(metrics?.totalAccounts || 0)}
                  </p>
                  <p className="font-bold text-primary">Profiles</p>
                </div>
                <Separator className="h-14" orientation="vertical" />
                <div className="flex flex-col gap-y-1">
                  <p className="text-3xl font-bold text-secondary-foreground solid-text-shadow">
                    {numberWithDelimiter(metrics?.totalActivities || 0)}
                  </p>
                  <p className="font-bold text-primary">Activities</p>
                </div>
              </div>

              {!isLive && event.launchesAt && (
                <Countdown launchesAt={event.launchesAt} />
              )}
            </div>

            <div className="flex w-fit flex-row flex-wrap items-center gap-2 rounded-3xl bg-background/80 p-4">
              {event.trailerUrl && (
                <a
                  href={event.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center gap-x-2 rounded-2xl border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Watch the trailer</span>
                </a>
              )}
              <Button
                variant="outline"
                className="flex h-12 items-center justify-center gap-x-2 rounded-2xl border border-primary bg-black/75 px-4 py-1.5 text-base font-medium shadow hover:bg-black/75"
                onClick={() => setIsSearchDialogOpen(true)}
              >
                <Search className="mr-1 h-5 w-5" />
                <span className="inline-flex">Search profiles</span>
              </Button>
              <Link
                to="/info/guide"
                className="flex h-12 items-center justify-center space-x-2 rounded-2xl border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow"
              >
                <img src={RuneLiteLogo} alt="RuneLite" width={32} height={32} />
                <span>Plugin Guide</span>
              </Link>
              <Link
                to="/info/discord-bot"
                className="flex h-12 items-center justify-center space-x-2 rounded-2xl border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow"
              >
                <Bot className="h-5 w-5" />
                <span>Discord Bot</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Absolutely positioned on desktop so the panel fills the hero's
            height instead of growing it — overflowing rows scroll. */}
        <div className="relative min-h-[640px] lg:w-[520px] lg:min-h-0">
          <EventLeaderboards
            event={event}
            className="h-full lg:absolute lg:inset-0"
          />
        </div>
      </div>
    </div>
  );
}

const COUNTDOWN_UNITS = [
  { label: "Days", ms: 86_400_000 },
  { label: "Hours", ms: 3_600_000 },
  { label: "Minutes", ms: 60_000 },
  { label: "Seconds", ms: 1000 },
];

function Countdown({ launchesAt }: { launchesAt: string }) {
  // Client-only: the server's clock would render a different value than the
  // first client render and break hydration.
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining =
    now === null ? null : Math.max(0, Date.parse(launchesAt) - now);

  // Launch time has passed but the item ids aren't in yet - nothing to count.
  if (remaining === 0) return null;

  return (
    <div className="flex w-fit flex-col gap-y-2 rounded-3xl bg-background/80 p-3">
      <p className="px-1 text-xs font-bold uppercase tracking-widest text-primary">
        Launches in
      </p>
      <div className="flex flex-row gap-x-2">
        {COUNTDOWN_UNITS.map((unit, index) => {
          const previous = COUNTDOWN_UNITS[index - 1];
          const value =
            remaining === null
              ? null
              : Math.floor(
                  (previous ? remaining % previous.ms : remaining) / unit.ms,
                );

          return (
            <div
              key={unit.label}
              className="flex w-16 flex-col items-center rounded-2xl bg-black/60 py-2"
            >
              <p className="font-runescape text-3xl leading-none text-osrs-yellow solid-text-shadow">
                {value === null ? "--" : String(value).padStart(2, "0")}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {unit.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
