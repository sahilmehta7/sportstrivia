"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getChipStyles, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ShowcasePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}

export function ShowcasePagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className,
}: ShowcasePaginationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxPageNumbers / 2);

    if (totalPages <= maxPageNumbers) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Show ellipsis or pages in the middle
      if (currentPage - half > 2) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - half);
      const end = Math.min(totalPages - 1, currentPage + half);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Show ellipsis or last page
      if (currentPage + half < totalPages - 1) {
        pages.push("...");
      }

      // Show last page (if not already included)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* First page button */}
      {showFirstLast && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
          className={cn(
            "h-9 w-9 rounded-full transition",
            getChipStyles("ghost"),
            currentPage === 1 && "opacity-50"
          )}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous page button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        className={cn(
          "h-9 w-9 rounded-full transition",
          getChipStyles("ghost"),
          currentPage === 1 && "opacity-50"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                    getTextColor("muted")
                  )}
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={isActive}
                aria-label={isActive ? `Current page, page ${pageNum}` : `Go to page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-9 w-9 rounded-full text-xs font-semibold transition",
                  isActive ? getChipStyles("solid") : getChipStyles("ghost")
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Next page button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        className={cn(
          "h-9 w-9 rounded-full transition",
          getChipStyles("ghost"),
          currentPage === totalPages && "opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page button */}
      {showFirstLast && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
          className={cn(
            "h-9 w-9 rounded-full transition",
            getChipStyles("ghost"),
            currentPage === totalPages && "opacity-50"
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
