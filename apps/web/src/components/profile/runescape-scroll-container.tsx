import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "~/lib/utils";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function RuneScapeScrollContainer({
  children,
  className,
  contentClassName,
}: CustomScrollbarProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollStartPosition, setScrollStartPosition] = useState(0);

  // Calculate the thumb height based on content
  const calculateThumbHeight = () => {
    if (!contentRef.current || !scrollTrackRef.current) return;

    const { scrollHeight, clientHeight } = contentRef.current;
    const trackHeight = scrollTrackRef.current.clientHeight;
    const thumbPercentage = clientHeight / scrollHeight;
    const thumbHeight = Math.max(thumbPercentage * trackHeight, 40); // Minimum thumb height

    if (scrollThumbRef.current) {
      scrollThumbRef.current.style.height = `${thumbHeight}px`;
    }
  };

  // Update thumb position when content is scrolled
  const updateThumbPosition = () => {
    if (
      !contentRef.current ||
      !scrollThumbRef.current ||
      !scrollTrackRef.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const trackHeight = scrollTrackRef.current.clientHeight;
    const thumbHeight = scrollThumbRef.current.clientHeight;

    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    const thumbPosition = scrollPercentage * (trackHeight - thumbHeight);

    scrollThumbRef.current.style.transform = `translateY(${thumbPosition}px)`;
  };

  // Handle mouse down on the thumb
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from reaching the track
    setIsDragging(true);
    setStartY(e.clientY);

    if (contentRef.current) {
      setScrollStartPosition(contentRef.current.scrollTop);
    }
  };

  // Handle mouse move while dragging
  const handleDocumentMouseMove = (e: MouseEvent) => {
    if (
      !isDragging ||
      !contentRef.current ||
      !scrollThumbRef.current ||
      !scrollTrackRef.current
    )
      return;

    const { scrollHeight, clientHeight } = contentRef.current;
    const trackHeight = scrollTrackRef.current.clientHeight;
    const thumbHeight = scrollThumbRef.current.clientHeight;

    const deltaY = e.clientY - startY;
    const percentage = deltaY / (trackHeight - thumbHeight);
    const scrollAmount = percentage * (scrollHeight - clientHeight);

    contentRef.current.scrollTop = scrollStartPosition + scrollAmount;
  };

  // Handle mouse up to stop dragging
  const handleDocumentMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Handle scroll increment/decrement buttons
  const handleScrollButton = (direction: "up" | "down") => {
    if (!contentRef.current) return;

    const scrollAmount = direction === "up" ? -50 : 50;
    contentRef.current.scrollTop += scrollAmount;
  };

  // Handle clicks on the track
  const handleTrackClick = (e: React.MouseEvent) => {
    if (
      !contentRef.current ||
      !scrollThumbRef.current ||
      !scrollTrackRef.current
    )
      return;

    // Make sure the click is directly on the track (not on the thumb)
    if (e.target !== scrollTrackRef.current) return;

    // Get the position of the click relative to the track
    const trackRect = scrollTrackRef.current.getBoundingClientRect();
    const clickPosition = e.clientY - trackRect.top;

    // Get the position and height of the thumb
    const thumbRect = scrollThumbRef.current.getBoundingClientRect();
    const thumbPosition = thumbRect.top - trackRect.top;

    // Determine if click is above or below the thumb
    const isClickAboveThumb = clickPosition < thumbPosition;

    // Calculate the scroll amount (one page)
    const { clientHeight } = contentRef.current;
    const scrollAmount = isClickAboveThumb ? -clientHeight : clientHeight;

    // Apply the scroll
    contentRef.current.scrollTop += scrollAmount;
  };

  // Initialize resize observer and event listeners
  useEffect(() => {
    if (!contentRef.current) return;

    // Initial calculations
    calculateThumbHeight();

    // Set up resize observer
    observer.current = new ResizeObserver(() => {
      calculateThumbHeight();
      updateThumbPosition();
    });

    observer.current.observe(contentRef.current);

    // Add event listeners for dragging
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    document.addEventListener("mouseleave", handleDocumentMouseUp);

    return () => {
      if (observer.current && contentRef.current) {
        observer.current.unobserve(contentRef.current);
      }

      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
      document.removeEventListener("mouseleave", handleDocumentMouseUp);
    };
  }, [isDragging, startY, scrollStartPosition]);

  // Update thumb position on content scroll
  useEffect(() => {
    const handleScroll = () => updateThumbPosition();

    if (contentRef.current) {
      contentRef.current.addEventListener("scroll", handleScroll);

      return () => {
        if (contentRef.current) {
          contentRef.current.removeEventListener("scroll", handleScroll);
        }
      };
    }
  }, []);

  return (
    <div className={cn("flex flex-grow max-h-full overflow-auto", className)}>
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
