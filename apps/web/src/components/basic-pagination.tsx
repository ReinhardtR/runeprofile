import React from "react";

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

export function BasicPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  siblingCount = 1,
  className,
}: {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // Helper function to generate a range of numbers
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  // Memoize the page numbers to avoid re-calculation on every render
  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 3; // 2 siblings on each side + current + first + last
    const totalBlocks = totalPageNumbers + 2; // totalPageNumbers + 2 for the ellipses

    // Case 1: Total pages are less than or equal to the total blocks needed for full display.
    // No ellipses needed, show all pages.
    if (totalPages <= totalBlocks) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Case 2: No left ellipsis, but right ellipsis is needed.
    // Show pages from 1 up to a certain point, then ellipsis, then last page.
    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const leftItemCount = 3 + 2 * siblingCount; // 1, 2, 3, ..., last
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    // Case 3: Left ellipsis is needed, but no right ellipsis.
    // Show first page, then ellipsis, then pages from a certain point to last.
    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      const rightItemCount = 3 + 2 * siblingCount; // first, ..., last-2, last-1, last
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, "...", ...rightRange];
    }

    // Case 4: Both left and right ellipses are needed.
    // Show first page, ellipsis, current page with siblings, ellipsis, last page.
    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "...", ...middleRange, "...", totalPages];
    }

    return []; // Should not reach here
  }, [totalItems, pageSize, currentPage, siblingCount, totalPages]);

  if (totalPages === 0) {
    return null; // Don't render pagination if there are no pages
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {paginationRange.map((page, index) => {
          if (page === "...") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem key={page}>
              <PaginationButton
                onClick={() => onPageChange(Number(page))}
                isActive={Number(page) === currentPage}
              >
                {page}
              </PaginationButton>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
