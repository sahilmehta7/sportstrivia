import { Skeleton } from "../../../../components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        {/* Grid/Quiz Skeleton */}
        <div className="aspect-square w-full max-w-[500px] mx-auto">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
