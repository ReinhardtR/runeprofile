import React from "react";

import { cn } from "~/lib/utils";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function RuneScapeScrollArea({
  children,
  className,
  contentClassName,
}: CustomScrollbarProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const scrollTrackRef = React.useRef<HTMLDivElement>(null);
  const scrollThumbRef = React.useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [scrollStartPosition, setScrollStartPosition] = React.useState(0);

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
      return;
    }

    const thumbRatio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(thumbRatio * trackHeight, 40);
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
    const thumbHeight = scrollThumbRef.current.offsetHeight;

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
    const { scrollHeight, clientHeight } = contentRef.current;

    contentRef.current.scrollTop =
      scrollStartPosition + scrollRatio * (scrollHeight - clientHeight);
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

  // Lifecycle
  React.useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateThumb();
    });

    observer.observe(contentRef.current);
    if (scrollTrackRef.current) observer.observe(scrollTrackRef.current);

    contentRef.current.addEventListener("scroll", updateThumbPosition);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      observer.disconnect();
      contentRef.current?.removeEventListener("scroll", updateThumbPosition);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [calculateThumb, isDragging, startY, scrollStartPosition]);

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
