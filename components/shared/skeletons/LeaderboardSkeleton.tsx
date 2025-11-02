import { cn } from "@/lib/utils";

interface LeaderboardSkeletonProps {
  rows?: number;
  className?: string;
}

export function LeaderboardSkeleton({ rows = 10, className }: LeaderboardSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      
      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <div className="h-4 w-4 rounded bg-muted-foreground/20" />
              </div>
              
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-muted" />
              
              {/* Name */}
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
            
            {/* Score */}
            <div className="text-right space-y-1">
              <div className="h-5 w-16 rounded bg-muted ml-auto" />
              <div className="h-3 w-12 rounded bg-muted ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

