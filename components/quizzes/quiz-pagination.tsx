"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShowcasePagination } from "@/components/showcase/ui/Pagination";
import { cn } from "@/lib/utils";

interface QuizPaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function QuizPagination({ page, pages, total, pageSize, onPageChange, className }: QuizPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (nextPage: number) => {
    if (onPageChange) {
      onPageChange(nextPage);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", nextPage.toString());
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: true,
      });
    }
  };

  const startResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endResult = Math.min(total, page * pageSize);

  return (
    <div className={cn("flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-4">
        <div className="h-4 w-1 bg-accent" />
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          RESULTS: <span className="text-foreground">{startResult.toLocaleString()}—{endResult.toLocaleString()}</span> / {" "}
          <span className="text-foreground">{total.toLocaleString()}</span> ARENAS
        </div>
      </div>

      {pages > 1 && (
        <ShowcasePagination
          currentPage={page}
          totalPages={pages}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
