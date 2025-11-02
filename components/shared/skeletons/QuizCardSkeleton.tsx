import { cn } from "@/lib/utils";

interface QuizCardSkeletonProps {
  className?: string;
}

export function QuizCardSkeleton({ className }: QuizCardSkeletonProps) {
  return (
    <div
      className={cn(
        "group relative w-[280px] overflow-hidden rounded-[2rem] border border-white/40 bg-white animate-pulse",
        className
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">
        {/* Image skeleton */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100" />
        
        {/* Content skeleton */}
        <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-5">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-5 w-1/2 rounded bg-slate-200" />
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-4 w-1 rounded-full bg-slate-300" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
          
          {/* Coach info */}
          <div className="mt-auto flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div className="space-y-1">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

