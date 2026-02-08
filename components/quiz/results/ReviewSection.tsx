import { prisma } from "@/lib/db";
import { QuizResultsReviewButton } from "@/components/quiz/results/QuizResultsReviewButton";

interface ReviewSectionProps {
    userId: string;
    quizId: string;
    quizSlug: string;
    quizTitle: string;
}

export async function ReviewSection({ userId, quizId, quizSlug, quizTitle }: ReviewSectionProps) {
    const existingReview = await prisma.quizReview.findUnique({
        where: {
            userId_quizId: {
                userId,
                quizId,
            },
        },
        select: {
            id: true,
            rating: true,
            comment: true,
        },
    });

    return (
        <QuizResultsReviewButton
            quizSlug={quizSlug}
            quizTitle={quizTitle}
            existingReview={existingReview}
        />
    );
}

export function ReviewSectionSkeleton() {
    return (
        <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse dark:bg-white/10" />
    )
}
