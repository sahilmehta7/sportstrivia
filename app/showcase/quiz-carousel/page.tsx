import { prisma } from "@/lib/db";
import {
  formatPlayerCount,
  formatQuizDuration,
  getSportGradient,
  getSportIcon,
} from "@/lib/quiz-formatters";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";
import { notFound } from "next/navigation";

export default async function QuizCarouselShowcasePage() {
  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 8,
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

  if (quizzes.length === 0) {
    notFound();
  }

  const items = quizzes.map((quiz, index) => ({
    id: quiz.id,
    title: quiz.title,
    badgeLabel: quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured",
    durationLabel: formatQuizDuration(quiz.duration ?? quiz.timePerQuestion),
    playersLabel: formatPlayerCount(quiz._count?.attempts),
    icon: getSportIcon(quiz.sport),
    accent: getSportGradient(quiz.sport, index),
    coverImageUrl: quiz.descriptionImageUrl,
  }));

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-16">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-10 top-12 h-80 w-80 rounded-full bg-emerald-500/30 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-pink-500/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl">
        <div className="mb-10 text-center text-white">
          <span className="inline-block rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
            Quiz Carousel
          </span>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Pick Your Next Challenge
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Swipe through featured leagues and jump straight into the action.
          </p>
        </div>

        <ShowcaseQuizCarousel items={items} />
      </div>
    </div>
  );
}
