import { cn } from "@/lib/utils";
import { QuizCardSkeleton } from "./QuizCardSkeleton";

interface QuizListSkeletonProps {
  count?: number;
  className?: string;
}

export function QuizListSkeleton({ count = 6, className }: QuizListSkeletonProps) {
  return (
    <div className={cn("grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <QuizCardSkeleton key={index} />
      ))}
    </div>
  );
}
