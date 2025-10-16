"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuizPaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}

export function QuizPagination({ page, pages, total, pageSize }: QuizPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageNumbers = useMemo(() => {
    if (pages <= 1) return [] as number[];

    const windowSize = 2;
    const start = Math.max(1, page - windowSize);
    const end = Math.min(pages, page + windowSize);
    const numbers: number[] = [];

    for (let current = start; current <= end; current += 1) {
      numbers.push(current);
    }

    return numbers;
  }, [page, pages]);

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: true,
    });
  };

  const canGoBack = page > 1;
  const canGoForward = page < pages;

  const startResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endResult = Math.min(total, page * pageSize);

  if (pages <= 1) {
    return (
      <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} quizzes</span>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startResult.toLocaleString()} – {endResult.toLocaleString()} of {" "}
        {total.toLocaleString()} quizzes
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={!canGoBack}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pageNumbers[0] !== 1 && (
            <Button variant="ghost" size="sm" onClick={() => goToPage(1)}>
              1
            </Button>
          )}
          {pageNumbers[0] && pageNumbers[0] > 2 && <span className="px-2 text-muted-foreground">…</span>}
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNumber)}
              className={pageNumber === page ? "pointer-events-none" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          {pageNumbers[pageNumbers.length - 1] &&
            pageNumbers[pageNumbers.length - 1] < pages - 1 && (
              <span className="px-2 text-muted-foreground">…</span>
            )}
          {pageNumbers[pageNumbers.length - 1] !== pages && (
            <Button variant="ghost" size="sm" onClick={() => goToPage(pages)}>
              {pages}
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={!canGoForward}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
