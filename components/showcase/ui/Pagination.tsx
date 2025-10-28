"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTheme } from "next-themes";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getChipStyles, getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";
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
  const { theme: nextTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map next-themes to showcase theme, defaulting to dark for consistency
  const theme: ShowcaseTheme = mounted 
    ? (nextTheme === "light" ? "light" : "dark")
    : "dark";

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

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* First page button */}
      {showFirstLast && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            "h-9 w-9 rounded-full transition",
            getChipStyles(theme, "ghost"),
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
        className={cn(
          "h-9 w-9 rounded-full transition",
          getChipStyles(theme, "ghost"),
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
                    getTextColor(theme, "muted")
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
                className={cn(
                  "h-9 w-9 rounded-full text-xs font-semibold transition",
                  isActive ? getChipStyles(theme, "solid") : getChipStyles(theme, "ghost")
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
        className={cn(
          "h-9 w-9 rounded-full transition",
          getChipStyles(theme, "ghost"),
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
          className={cn(
            "h-9 w-9 rounded-full transition",
            getChipStyles(theme, "ghost"),
            currentPage === totalPages && "opacity-50"
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

