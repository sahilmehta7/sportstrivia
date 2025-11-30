import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { QuizPlayClient } from "@/components/quiz/QuizPlayClient";
import { getAttemptLimitStatus } from "@/lib/services/attempt-limit.service";

interface QuizPlayPageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuizPlayPage({ params }: QuizPlayPageProps) {
  const { slug } = await params;
  const session = await auth();

  // Middleware ensures session exists, so we can safely use it
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      status: true,
      isPublished: true,
      maxAttemptsPerUser: true,
      attemptResetPeriod: true,
    },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    notFound();
  }

  const now = new Date();
  const userId = session!.user!.id;
  const attemptLimitStatus = quiz.maxAttemptsPerUser
    ? await getAttemptLimitStatus(prisma, {
        userId,
        quiz: {
          id: quiz.id,
          maxAttemptsPerUser: quiz.maxAttemptsPerUser,
          attemptResetPeriod: quiz.attemptResetPeriod,
        },
        referenceDate: now,
      })
    : null;

  const initialAttemptLimit = quiz.maxAttemptsPerUser
    ? {
        max: quiz.maxAttemptsPerUser,
        remaining: attemptLimitStatus?.remainingBeforeStart ?? quiz.maxAttemptsPerUser,
        period: quiz.attemptResetPeriod,
        resetAt: attemptLimitStatus?.resetAt
          ? attemptLimitStatus.resetAt.toISOString()
          : null,
        isLocked: attemptLimitStatus?.isLimitReached ?? false,
      }
    : null;

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8">
      <QuizPlayClient
        quizId={quiz.id}
        quizTitle={quiz.title}
        quizSlug={slug}
        initialAttemptLimit={initialAttemptLimit}
      />
    </div>
  );
}
