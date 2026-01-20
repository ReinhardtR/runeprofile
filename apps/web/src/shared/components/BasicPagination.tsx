import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
} from "~/shared/components/ui/pagination";

export function BasicPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  className,
}: {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages === 0) {
    return null;
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <span className="px-3 text-sm select-none text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationButton
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            <ChevronsLeft size={16} />
          </PaginationButton>
        </PaginationItem>
        <PaginationItem>
          <PaginationButton
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </PaginationButton>
        </PaginationItem>
        <PaginationItem>
          <PaginationButton
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </PaginationButton>
        </PaginationItem>
        <PaginationItem>
          <PaginationButton
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight size={16} />
          </PaginationButton>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
