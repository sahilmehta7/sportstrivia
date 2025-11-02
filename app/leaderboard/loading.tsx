import { LeaderboardSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <LeaderboardSkeleton rows={10} />
    </div>
  );
}

