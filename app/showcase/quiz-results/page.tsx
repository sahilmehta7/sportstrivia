import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ShowcaseQuizResults } from "@/components/quiz/ShowcaseQuizResults";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";

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
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Results"
        subtitle="Interactive showcase of quiz results page with real data and light/dark mode support"
        badge="RESULTS SHOWCASE"
        variant="default"
      >
        {attempt && (
          <p className="text-sm text-center mb-6 opacity-60">
            Using real quiz attempt: &ldquo;{attempt.quiz.title}&rdquo; by {attempt.user.name}
          </p>
        )}
        <ShowcaseQuizResults 
          attempt={attempt}
          leaderboardData={leaderboardData}
        />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
