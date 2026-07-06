import React from "react";

import { cn } from "~/shared/utils";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function RuneScapeScrollArea({
  children,
  className,
  contentClassName,
  scrollRef,
}: CustomScrollbarProps) {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const contentRef = scrollRef ?? internalRef;
  const scrollTrackRef = React.useRef<HTMLDivElement>(null);
  const scrollThumbRef = React.useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [scrollStartPosition, setScrollStartPosition] = React.useState(0);
  const [dragScrollHeight, setDragScrollHeight] = React.useState(0);
  const lastScrollHeightRef = React.useRef(0);
  const lastThumbHeightRef = React.useRef(0);

  const calculateThumb = React.useCallback(() => {
    if (
      !contentRef.current ||
      !scrollTrackRef.current ||
      !scrollThumbRef.current
    )
      return;

    const { scrollHeight, clientHeight } = contentRef.current;
    const trackHeight = scrollTrackRef.current.clientHeight;

    if (scrollHeight <= clientHeight) {
      scrollThumbRef.current.style.height = `100%`;
      scrollThumbRef.current.style.transform = `translateY(0px)`;
      lastScrollHeightRef.current = scrollHeight;
      lastThumbHeightRef.current = trackHeight;
      return;
    }

    const thumbRatio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(thumbRatio * trackHeight, 40);
    lastScrollHeightRef.current = scrollHeight;
    lastThumbHeightRef.current = thumbHeight;
    scrollThumbRef.current.style.height = `${thumbHeight}px`;

    updateThumbPosition();
  }, []);

  const updateThumbPosition = () => {
    if (
      !contentRef.current ||
      !scrollThumbRef.current ||
      !scrollTrackRef.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const trackHeight = scrollTrackRef.current.clientHeight;

    // Recalculate thumb size only if scrollHeight changed meaningfully
    if (Math.abs(scrollHeight - lastScrollHeightRef.current) > 5) {
      lastScrollHeightRef.current = scrollHeight;
      if (scrollHeight <= clientHeight) {
        scrollThumbRef.current.style.height = `100%`;
        lastThumbHeightRef.current = trackHeight;
      } else {
        const thumbRatio = clientHeight / scrollHeight;
        const thumbHeight = Math.max(thumbRatio * trackHeight, 40);
        lastThumbHeightRef.current = thumbHeight;
        scrollThumbRef.current.style.height = `${thumbHeight}px`;
      }
    }

    const thumbHeight = lastThumbHeightRef.current;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    const thumbOffset = scrollRatio * (trackHeight - thumbHeight);

    scrollThumbRef.current.style.transform = `translateY(${thumbOffset}px)`;
  };

  // Drag handlers
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    if (contentRef.current) {
      setScrollStartPosition(contentRef.current.scrollTop);
      setDragScrollHeight(contentRef.current.scrollHeight);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (
      !isDragging ||
      !contentRef.current ||
      !scrollTrackRef.current ||
      !scrollThumbRef.current
    )
      return;

    const trackHeight = scrollTrackRef.current.clientHeight;
    const thumbHeight = scrollThumbRef.current.offsetHeight;
    const deltaY = e.clientY - startY;
    const scrollRatio = deltaY / (trackHeight - thumbHeight);
    const { clientHeight } = contentRef.current;

    contentRef.current.scrollTop =
      scrollStartPosition + scrollRatio * (dragScrollHeight - clientHeight);
  };

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  // Button scroll
  const handleScrollButton = (direction: "up" | "down") => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop += direction === "up" ? -50 : 50;
  };

  // Track click (page scroll)
  const handleTrackClick = (e: React.MouseEvent) => {
    if (
      !contentRef.current ||
      !scrollThumbRef.current ||
      !scrollTrackRef.current ||
      e.target !== scrollTrackRef.current
    )
      return;

    const trackRect = scrollTrackRef.current.getBoundingClientRect();
    const thumbRect = scrollThumbRef.current.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const thumbTop = thumbRect.top - trackRect.top;

    const pageScroll = contentRef.current.clientHeight;
    contentRef.current.scrollTop +=
      clickY < thumbTop ? -pageScroll : pageScroll;
  };

  // ResizeObserver + scroll listener (stable — only depends on refs)
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateThumb();
    });

    resizeObserver.observe(content);
    if (scrollTrackRef.current) resizeObserver.observe(scrollTrackRef.current);

    // Also observe the scrollable content itself. The container has a fixed
    // height, so growing/shrinking the content (e.g. a virtualized list whose
    // total size changes when filters change) never resizes the container —
    // only its children. Observing them keeps the thumb size in sync without
    // waiting for a scroll event. A MutationObserver re-syncs the observed
    // children when the content swaps them out (e.g. empty ↔ populated list).
    const observedChildren = new Set<Element>();
    const syncChildren = () => {
      for (const child of Array.from(content.children)) {
        if (!observedChildren.has(child)) {
          resizeObserver.observe(child);
          observedChildren.add(child);
        }
      }
      calculateThumb();
    };
    syncChildren();

    const mutationObserver = new MutationObserver(syncChildren);
    mutationObserver.observe(content, { childList: true });

    content.addEventListener("scroll", updateThumbPosition);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      content.removeEventListener("scroll", updateThumbPosition);
    };
  }, [calculateThumb]);

  // Drag handlers (re-attached when drag state changes)
  React.useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startY, scrollStartPosition]);

  return (
    <div className={cn("flex flex-grow max-h-full overflow-hidden", className)}>
      <div
        ref={contentRef}
        className={cn("flex-1 overflow-auto scrollbar-hide", contentClassName)}
      >
        {children}
      </div>

      <div className="flex flex-col">
        <button
          className="runescape-scroll-up cursor-pointer"
          onClick={() => handleScrollButton("up")}
          aria-label="Scroll up"
        />
        <div
          ref={scrollTrackRef}
          className="runescape-scroll-track flex-grow relative mx-auto"
          onClick={handleTrackClick}
        >
          <div
            ref={scrollThumbRef}
            className="runescape-scroll-thumb absolute top-0 w-full cursor-pointer"
            onMouseDown={handleThumbMouseDown}
            aria-hidden="true"
          />
        </div>
        <button
          className="runescape-scroll-down cursor-pointer"
          onClick={() => handleScrollButton("down")}
          aria-label="Scroll down"
        />
      </div>
    </div>
  );
}
