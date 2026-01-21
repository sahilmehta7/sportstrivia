"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage - half > 2) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - half);
      const end = Math.min(totalPages - 1, currentPage + half);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage + half < totalPages - 1) {
        pages.push("...");
      }
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
    <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
      {/* First page button */}
      {showFirstLast && (
        <Button
          variant="glass"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
          className="h-10 w-10 rounded-2xl transition-all duration-300 disabled:opacity-20 hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous page button */}
      <Button
        variant="glass"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        className="h-10 w-10 rounded-2xl transition-all duration-300 shadow-sm border-white/5 disabled:opacity-20"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 w-8 items-center justify-center text-[10px] font-black tracking-widest text-muted-foreground/40"
                >
                  •••
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isActive ? "neon" : "glass"}
                size="icon"
                onClick={() => handlePageChange(pageNum)}
                disabled={isActive}
                aria-label={isActive ? `Current page, page ${pageNum}` : `Go to page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-10 w-10 rounded-2xl text-[10px] font-black transition-all duration-300",
                  isActive ? "shadow-neon-cyan/20 scale-105" : "border-white/5 opacity-80 hover:opacity-100"
                )}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
      )}

      {/* Next page button */}
      <Button
        variant="glass"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        className="h-10 w-10 rounded-2xl transition-all duration-300 shadow-sm border-white/5 disabled:opacity-20"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page button */}
      {showFirstLast && (
        <Button
          variant="glass"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
          className="h-10 w-10 rounded-2xl transition-all duration-300 disabled:opacity-20 hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
