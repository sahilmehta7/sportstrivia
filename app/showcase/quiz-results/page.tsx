import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { buildGlobalLeaderboard } from "@/lib/services/leaderboard.service";
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

async function getLeaderboardData() {
  try {
    const [dailyLeaderboard, allTimeLeaderboard] = await Promise.all([
      buildGlobalLeaderboard("daily", 10),
      buildGlobalLeaderboard("all-time", 10),
    ]);

    return {
      daily: dailyLeaderboard,
      allTime: allTimeLeaderboard,
    };
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return {
      daily: [],
      allTime: [],
    };
  }
}

export default async function QuizResultsShowcasePage() {
  const [attempt, leaderboardData] = await Promise.all([
    getLatestQuizAttempt(),
    getLeaderboardData(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Results Showcase</h1>
          <p className="text-muted-foreground">
            Interactive showcase of quiz results page with real data and light/dark mode support
          </p>
          {attempt && (
            <p className="text-sm text-muted-foreground mt-2">
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
