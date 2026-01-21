import { cn } from "@/lib/utils";

interface QuizCardSkeletonProps {
  className?: string;
}

export function QuizCardSkeleton({ className }: QuizCardSkeletonProps) {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 animate-pulse",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Placeholder for Aspect Ratio */}
        <div className="relative aspect-[16/9] w-full bg-white/5" />

        {/* Content skeleton */}
        <div className="flex flex-1 flex-col gap-6 p-8">
          {/* Title */}
          <div className="space-y-3">
            <div className="h-6 w-3/4 rounded-lg bg-white/10" />
            <div className="h-6 w-1/2 rounded-lg bg-white/10" />
          </div>

          {/* Stats info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-white/10" />
              <div className="h-3 w-12 rounded-md bg-white/10" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-white/10" />
              <div className="h-3 w-12 rounded-md bg-white/10" />
            </div>
          </div>
        </div>

        {/* Bottom bar placeholder */}
        <div className="h-1 w-full bg-white/5" />
      </div>
    </div>
  );
}
