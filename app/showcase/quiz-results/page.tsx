import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ShowcaseQuizResults } from "@/components/quiz/ShowcaseQuizResults";

export const metadata: Metadata = {
  title: "Quiz Results Showcase",
  description: "Showcase of quiz results page with real data and light/dark mode support",
};

async function getLatestQuizAttempt() {
  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        completedAt: { not: null },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            passingScore: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        userAnswers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                explanation: true,
              },
            },
            answer: {
              select: {
                id: true,
                answerText: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    return attempt;
  } catch (error) {
    console.error("Failed to fetch quiz attempt:", error);
    return null;
  }
}

async function getQuizLeaderboard(quizId: string) {
  try {
    // Get quiz-specific leaderboard entries
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        completedAt: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { score: "desc" },
        { totalPoints: "desc" },
        { completedAt: "asc" },
      ],
      take: 10,
    });

    return quizAttempts.map((attempt, index) => ({
      userId: attempt.userId,
      userName: attempt.user.name,
      userImage: attempt.user.image,
      score: attempt.score || 0,
      totalPoints: attempt.totalPoints || 0,
      position: index + 1,
    }));
  } catch (error) {
    console.error("Failed to fetch quiz leaderboard:", error);
    return [];
  }
}

export default async function QuizResultsShowcasePage() {
  const attempt = await getLatestQuizAttempt();
  const leaderboardData = attempt ? await getQuizLeaderboard(attempt.quiz.id) : [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70 mb-6">
            QUIZ RESULTS SHOWCASE
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)] sm:text-5xl lg:text-6xl mb-4">
            Quiz Results
            <span className="text-emerald-300"> Showcase</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-white/75 mb-4">
            Interactive showcase of quiz results page with real data and light/dark mode support
          </p>
          {attempt && (
            <p className="text-sm text-white/60">
              Using real quiz attempt: &ldquo;{attempt.quiz.title}&rdquo; by {attempt.user.name}
            </p>
          )}
        </div>

        <ShowcaseQuizResults 
          attempt={attempt}
          leaderboardData={leaderboardData}
        />
      </div>
    </div>
  );
}
