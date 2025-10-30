"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ShowcasePagination } from "@/components/showcase/ui/Pagination";

export function SearchPaginationClient({
  page,
  pages,
}: {
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <ShowcasePagination
      currentPage={page}
      totalPages={pages}
      onPageChange={handlePageChange}
    />
  );
}


