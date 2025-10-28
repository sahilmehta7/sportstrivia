import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShowcaseFeaturedQuizCard } from "@/components/quiz/ShowcaseFeaturedQuizCard";
import {
  formatPlayerCount,
  formatQuizDuration,
  getSportGradient,
} from "@/lib/quiz-formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/showcase/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Random Quiz Challenge | Sports Trivia",
  description: "Test your knowledge with a randomly selected sports trivia quiz. One chance to prove yourself!",
  openGraph: {
    title: "Random Quiz Challenge",
    description: "Take on a randomly selected sports trivia challenge with only one attempt to prove your knowledge.",
    type: "website",
  },
};

function renderNoRandomQuiz() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 py-12">
      <div className="container mx-auto px-4">
        <Link href="/quizzes">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">No Random Quiz Available</h1>
              <p className="text-muted-foreground">
                You&apos;ve either attempted all single-attempt quizzes or there are none available at the moment.
              </p>
              <GlassButton asChild tone="light" className="mt-6">
                <Link href="/quizzes">Browse All Quizzes</Link>
              </GlassButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default async function RandomQuizPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  // Fetch all single-attempt quizzes that haven't been attempted by the user
  const attemptedQuizIds = await prisma.quizAttempt.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    select: {
      quizId: true,
    },
  });

  const attemptedIds = attemptedQuizIds.map((attempt) => attempt.quizId);

  const singleAttemptWhere: Prisma.QuizWhereInput = {
    isPublished: true,
    status: "PUBLISHED",
    maxAttemptsPerUser: 1, // Single attempt quiz
    ...(attemptedIds.length > 0
      ? {
          id: {
            notIn: attemptedIds,
          },
        }
      : {}),
  };

  const availableCount = await prisma.quiz.count({
    where: singleAttemptWhere,
  });

  if (availableCount === 0) {
    return renderNoRandomQuiz();
  }

  const randomIndex = Math.floor(Math.random() * availableCount);

  const quiz = await prisma.quiz.findFirst({
    where: singleAttemptWhere,
    skip: randomIndex,
    orderBy: {
      createdAt: "asc",
    },
    include: {
      _count: {
        select: {
          attempts: true,
        },
      },
      topicConfigs: {
        include: {
          topic: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!quiz) {
    return renderNoRandomQuiz();
  }

  const category = quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? "Featured";
  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = `${formatPlayerCount(quiz._count?.attempts ?? 0)} players`;
  const difficultyLabel = (quiz.difficulty ?? "Medium").toString().toLowerCase().replace(/_/g, " ");
  const ratingLabel = quiz.averageRating && quiz.averageRating > 0 ? `${quiz.averageRating.toFixed(1)} / 5` : undefined;
  const accent = getSportGradient(quiz.sport);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 py-12">
      <div className="container mx-auto px-4">
        <Link href="/quizzes">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </Link>

        <div className="mb-10 space-y-4 text-center md:text-left">
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground drop-shadow-[0_18px_45px_rgba(15,23,42,0.18)] sm:text-5xl">
            <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Random Quiz
            </span>{" "}
            Challenge
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground/90 sm:text-base md:mx-0">
            Test your knowledge with this randomly selected quiz
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-5xl justify-center">
          <ShowcaseFeaturedQuizCard
            title={quiz.title}
            subtitle={quiz.description}
            category={category}
            durationLabel={durationLabel}
            difficultyLabel={difficultyLabel}
            playersLabel={playersLabel}
            ratingLabel={ratingLabel}
            coverImageUrl={quiz.descriptionImageUrl ?? undefined}
            accent={accent}
            ctaHref={`/quizzes/${quiz.slug}`}
          />
        </div>
      </div>
    </main>
  );
}
