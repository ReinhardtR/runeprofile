import React from "react";

import { cn } from "~/shared/utils";

// The slice of the YouTube IFrame Player API used here.
type YouTubePlayer = {
  mute(): void;
  setVolume(volume: number): void;
  unloadModule(module: string): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: (event: { target: YouTubePlayer }) => void;
        onStateChange?: (event: {
          target: YouTubePlayer;
          data: number;
        }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApi: Promise<YouTubeApi> | undefined;

function loadYouTubeApi(): Promise<YouTubeApi> {
  youTubeApi ??= new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return youTubeApi;
}

// No sound and no subtitles. cc_load_policy only sets the default, and a
// viewer's own YouTube caption setting wins over it, so the captions module
// is unloaded outright.
function silence(player: YouTubePlayer) {
  player.mute();
  player.setVolume(0);
  player.unloadModule("captions");
  player.unloadModule("cc");
}

// Jump back this far before the end, so YouTube's end screen never shows.
const LOOP_LEAD_SECONDS = 0.6;

// How long to wait on black before giving up on playback (autoplay blocked,
// e.g. by iOS Low Power Mode) and showing the poster instead.
const POSTER_FALLBACK_MS = 5000;

/**
 * A muted YouTube video looping from startSeconds as a cover background,
 * played through the official embed. It fades in from black once it's
 * actually playing; visitors who prefer reduced motion, or whose browser
 * won't autoplay it, get the still poster instead.
 */
export function VideoBackground({
  youtubeId,
  startSeconds,
  poster,
  className,
}: {
  youtubeId: string;
  startSeconds: number;
  poster: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showPoster, setShowPoster] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowPoster(true);
      return;
    }

    let cancelled = false;
    let player: YouTubePlayer | undefined;
    let loopTimer: ReturnType<typeof setInterval> | undefined;
    const posterTimer = setTimeout(
      () => setShowPoster(true),
      POSTER_FALLBACK_MS,
    );

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      // The API swaps its target element for an iframe, so give it one React
      // doesn't own.
      const target = document.createElement("div");
      container.appendChild(target);

      player = new YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
          rel: 0,
          start: startSeconds,
        },
        events: {
          onReady: ({ target }) => {
            silence(target);
            target.playVideo();
            loopTimer = setInterval(() => {
              const duration = target.getDuration();
              if (
                duration > 0 &&
                target.getCurrentTime() >= duration - LOOP_LEAD_SECONDS
              ) {
                target.seekTo(startSeconds, true);
              }
            }, 250);
          },
          onStateChange: ({ target, data }) => {
            if (data === YT.PlayerState.PLAYING) {
              // Captions load with playback, so they're dropped again here.
              silence(target);
              clearTimeout(posterTimer);
              setIsPlaying(true);
            }
            // Fallback for when the poll misses the end.
            if (data === YT.PlayerState.ENDED) {
              target.seekTo(startSeconds, true);
              target.playVideo();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(posterTimer);
      clearInterval(loopTimer);
      player?.destroy();
      container.replaceChildren();
    };
  }, [youtubeId, startSeconds]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      <img
        src={poster}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
          showPoster && !isPlaying ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Sized to cover the hero at 16:9 whatever its shape, then scaled up a
          little more so YouTube's own chrome at the edges is cropped off. */}
      <div
        ref={containerRef}
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.15] transition-opacity duration-1000",
          isPlaying ? "opacity-100" : "opacity-0",
        )}
        style={{
          width: "max(100vw, 177.78vh, 1245px)",
          height: "max(100vh, 56.25vw, 700px)",
        }}
      />
    </div>
  );
}
