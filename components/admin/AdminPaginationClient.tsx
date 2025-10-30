"use client";

import { ShowcasePagination } from "@/components/showcase/ui/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AdminPaginationClientProps {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  variant?: "client" | "server";
  filterParams?: {
    search?: string;
    topicId?: string;
    difficulty?: string;
    limit?: string;
  };
}

export function AdminPaginationClient({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  variant = "client",
  filterParams = {},
}: AdminPaginationClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (variant === "client") {

    const goToPage = (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    return (
      <ShowcasePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    );
  }

  // Server variant - use Link components
  const buildPageLink = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filterParams.search) params.set("search", filterParams.search);
    if (filterParams.topicId) params.set("topicId", filterParams.topicId);
    if (filterParams.difficulty) params.set("difficulty", filterParams.difficulty);
    if (filterParams.limit) params.set("limit", filterParams.limit);
    params.set("page", targetPage.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={!hasPrevious} asChild>
        <Link href={hasPrevious ? buildPageLink(currentPage - 1) : "#"} aria-disabled={!hasPrevious}>
          Previous
        </Link>
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={!hasNext} asChild>
        <Link href={hasNext ? buildPageLink(currentPage + 1) : "#"} aria-disabled={!hasNext}>
          Next
        </Link>
      </Button>
    </div>
  );
}

