import { useQuery } from "@tanstack/react-query";
import React from "react";

import {
  parseModel,
  renderScene,
} from "@runeprofile/model-renderer/rasterizer";

import { getProfileModel } from "~/core/api";
import { loadDefaultModelBytes } from "~/shared/model/default-model";
import { cn } from "~/shared/utils";

/** The chathead angle the Discord activity cards use, facing right. */
export const CHATHEAD_YAW = 2.49;

type PortraitFraming = {
  /** Model rotation in radians; see CHATHEAD_YAW. */
  yaw?: number;
  /** Fraction of the body kept from the top of the head down. */
  cropTop?: number;
  /** Fraction of the canvas left above the head for hats and weapons. */
  headroomTop?: number;
  /** Where the head lands across the canvas, 0 (left) to 1 (right). */
  anchorX?: number;
};

/**
 * A cropped, static render of a player's model - the same software
 * rasterizer and body-relative framing as the Discord activity cards, so
 * there is no WebGL context per portrait and no pet. Fills its container;
 * held gear past the head runs on to the container's edges.
 */
export function PlayerPortrait({
  username,
  className,
  yaw = CHATHEAD_YAW,
  cropTop = 0.5,
  headroomTop = 0.08,
  anchorX = 0.5,
}: PortraitFraming & {
  /** null renders the default character. */
  username: string | null;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const size = useElementSize(containerRef);
  const [isDrawn, setIsDrawn] = React.useState(false);

  const { data: model } = useQuery({
    queryKey: ["player-portrait-model", username?.toLowerCase() ?? null],
    queryFn: async () => {
      const bytes = username
        ? await getProfileModel({ username }).catch(() =>
            loadDefaultModelBytes(),
          )
        : await loadDefaultModelBytes();
      return parseModel(bytes);
    },
    staleTime: Infinity,
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!model || !size || !canvas) return;

    // Render at device resolution (capped) so the portrait stays crisp;
    // supersampling only pays off on 1x screens.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(size.width * dpr);
    const height = Math.round(size.height * dpr);
    if (width === 0 || height === 0) return;

    const rgba = renderScene([{ model, yaw }], {
      width,
      height,
      cropTop,
      cropRef: "body",
      headroomTop,
      fit: "height",
      centerOn: "head",
      anchorX,
      supersample: dpr >= 2 ? 1 : 2,
    });

    canvas.width = width;
    canvas.height = height;
    canvas
      .getContext("2d")
      ?.putImageData(
        new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height),
        0,
        0,
      );
    setIsDrawn(true);
  }, [model, size, yaw, cropTop, headroomTop, anchorX]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-500",
          isDrawn ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((prev) =>
        prev?.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
