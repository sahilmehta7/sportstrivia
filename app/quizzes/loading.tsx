import { QuizListSkeleton } from "@/components/shared/skeletons";
import { PageContainer } from "@/components/shared/PageContainer";

export default function Loading() {
  return (
    <PageContainer className="pt-12">
      <div className="mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <QuizListSkeleton count={12} />
    </PageContainer>
  );
}

