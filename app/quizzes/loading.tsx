import { QuizListSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-12">
      <div className="mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <QuizListSkeleton count={12} />
    </div>
  );
}

