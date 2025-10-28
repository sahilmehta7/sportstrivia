"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShowcasePagination } from "@/components/showcase/ui/Pagination";

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

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: true,
    });
  };

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
      <ShowcasePagination
        currentPage={page}
        totalPages={pages}
        onPageChange={goToPage}
      />
    </div>
  );
}
