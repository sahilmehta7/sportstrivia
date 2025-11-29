import { ProfileSkeleton } from "@/components/shared/skeletons";
import { PageContainer } from "@/components/shared/PageContainer";

export default function Loading() {
  return (
    <PageContainer variant="narrow" className="py-8">
      <ProfileSkeleton />
    </PageContainer>
  );
}

