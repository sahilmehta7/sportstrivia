import { cn } from "@/lib/utils";

interface ProfileSkeletonProps {
  className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-6", className)}>
      {/* Header section */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="h-24 w-24 rounded-full bg-muted" />
        
        {/* User info */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="h-8 w-48 rounded bg-muted mx-auto sm:mx-0" />
          <div className="h-4 w-32 rounded bg-muted mx-auto sm:mx-0" />
          <div className="flex gap-4 justify-center sm:justify-start">
            <div className="h-6 w-20 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-4">
            <div className="h-4 w-20 rounded bg-muted mb-2" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      
      {/* Content sections */}
      <div className="space-y-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="h-5 w-3/4 rounded bg-muted mb-2" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

