import { LeaderboardSkeleton } from "@/components/shared/skeletons";
import { PageContainer } from "@/components/shared/PageContainer";

export default function Loading() {
  return (
    <PageContainer variant="narrow" className="py-8">
      <LeaderboardSkeleton rows={10} />
    </PageContainer>
  );
}

