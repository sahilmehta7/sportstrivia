import { QuizCardSkeleton } from "./QuizCardSkeleton";

interface QuizListSkeletonProps {
  count?: number;
  className?: string;
}

export function QuizListSkeleton({ count = 6, className }: QuizListSkeletonProps) {
  return (
    <div className={`flex flex-wrap gap-6 justify-center ${className || ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <QuizCardSkeleton key={index} />
      ))}
    </div>
  );
}

