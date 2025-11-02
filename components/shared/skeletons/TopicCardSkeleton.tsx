import { cn } from "@/lib/utils";

interface TopicCardSkeletonProps {
  className?: string;
}

export function TopicCardSkeleton({ className }: TopicCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border bg-card p-6 animate-pulse",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon/Emoji placeholder */}
        <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0" />
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          
          {/* Meta info */}
          <div className="flex items-center gap-4 pt-2">
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

