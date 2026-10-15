import React from "react";

import { cn } from "~/shared/utils";

// How long to wait on black before giving up on playback (autoplay blocked,
// e.g. by iOS Low Power Mode) and showing the poster instead.
const POSTER_FALLBACK_MS = 5000;

/**
 * A muted, looping cover video. It fades in from black once it's actually
 * playing; if the browser won't autoplay it, the still poster shows instead.
 * It plays regardless of prefers-reduced-motion, by choice: the trailer is
 * the hero's whole look.
 *
 * Sources are tried in order, so put the most efficient codec first with a
 * widely supported fallback after it.
 */
export function VideoBackground({
  sources,
  poster,
  className,
}: {
  sources: { src: string; type: string }[];
  poster: string;
  className?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  // The video is only rendered on the client: React doesn't render the
  // `muted` attribute during SSR, which mobile browsers require before
  // they'll autoplay.
  const [shouldPlay, setShouldPlay] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showPoster, setShowPoster] = React.useState(false);

  React.useEffect(() => {
    setShouldPlay(true);
    const posterTimer = setTimeout(
      () => setShowPoster(true),
      POSTER_FALLBACK_MS,
    );
    return () => clearTimeout(posterTimer);
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!shouldPlay || !video) return;
    video.muted = true;
    video.play().catch(() => setShowPoster(true));
  }, [shouldPlay]);

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
      {shouldPlay && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          onPlaying={() => setIsPlaying(true)}
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            isPlaying ? "opacity-100" : "opacity-0",
          )}
        >
          {sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      )}
    </div>
  );
}
