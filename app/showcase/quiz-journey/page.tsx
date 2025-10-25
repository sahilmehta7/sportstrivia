import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { ShowcaseQuizDetailHero } from "@/components/quiz/ShowcaseQuizDetailHero";
import {
  type ShowcaseQuizExperienceQuestion,
} from "@/components/quiz/ShowcaseQuizExperience";
import { ShowcaseQuizExperienceToggle } from "@/components/quiz/ShowcaseQuizExperienceToggle";
import { ShowcaseQuizResults } from "@/components/quiz/ShowcaseQuizResults";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";

export const metadata: Metadata = {
  title: "Showcase | Quiz Journey",
  description: "Unified walkthrough of the quiz detail, play, and results experiences",
};

async function getQuizJourneyData() {
  const quiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      status: "PUBLISHED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          attempts: true,
        },
      },
      leaderboard: {
        take: 3,
        orderBy: [
          { bestPoints: "desc" },
          { averageResponseTime: "asc" },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
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
      questionPool: {
        orderBy: {
          order: "asc",
        },
        take: 4,
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionImageUrl: true,
              timeLimit: true,
              answers: {
                select: {
                  id: true,
                  answerText: true,
                  answerImageUrl: true,
                  answerVideoUrl: true,
                  answerAudioUrl: true,
                  isCorrect: true,
                },
                orderBy: {
                  displayOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  const fallbackTime = quiz.timePerQuestion ?? 5 * 60;

  const experienceQuestions: ShowcaseQuizExperienceQuestion[] = quiz.questionPool
    .map((entry, index) => {
      const question = entry.question;
      if (!question || question.answers.length === 0) {
        return null;
      }

      const baseTime = question.timeLimit ?? fallbackTime;
      const lowerBound = Math.max(12, Math.floor(baseTime * 0.5));
      const simulatedTime = Math.max(baseTime - index * 12 - 5, lowerBound);

      const correctAnswer = question.answers.find((answer) => answer.isCorrect);

      return {
        id: question.id,
        prompt: question.questionText,
        imageUrl: question.questionImageUrl,
        timeLimit: baseTime,
        timeRemaining: simulatedTime,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.answerText,
          imageUrl: answer.answerImageUrl,
          videoUrl: answer.answerVideoUrl,
          audioUrl: answer.answerAudioUrl,
          isCorrect: answer.isCorrect ?? false,
        })),
        correctAnswerId: correctAnswer?.id ?? null,
      } satisfies ShowcaseQuizExperienceQuestion;
    })
    .filter(Boolean) as ShowcaseQuizExperienceQuestion[];

  const latestAttempt = await prisma.quizAttempt.findFirst({
    where: {
      quizId: quiz.id,
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

  let leaderboardData: LeaderboardEntry[] = [];

  if (latestAttempt) {
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
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

    leaderboardData = quizAttempts.map((attempt, index) => ({
      userId: attempt.userId,
      userName: attempt.user.name,
      userImage: attempt.user.image,
      score: attempt.score || 0,
      totalPoints: attempt.totalPoints || 0,
      rank: index + 1,
    }));
  }

  return {
    quiz,
    experienceQuestions,
    latestAttempt,
    leaderboardData,
  };
}

export default async function ShowcaseQuizJourneyPage() {
  const { quiz, experienceQuestions, latestAttempt, leaderboardData } = await getQuizJourneyData();

  if (experienceQuestions.length === 0) {
    notFound();
  }

  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const bonusLabel =
    quiz.timeBonusEnabled && quiz.bonusPointsPerSecond > 0
      ? `+${quiz.bonusPointsPerSecond.toFixed(1)} pts/s`
      : "Streak Safe";
  const playersLabel = formatPlayerCount(quiz._count?.attempts);
  const badgeLabel =
    quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured";

  const gradients = [0, 1, 2, 3].map((index) => getSportGradient(quiz.sport, index));

  const leaderboardEntries = quiz.leaderboard.map((entry, index) => ({
    name:
      entry.user?.name || entry.user?.email?.split("@")[0] || `Player ${index + 1}`,
    score: Math.round(entry.bestPoints ?? 0),
    rankLabel: entry.rank && entry.rank < 999999 ? `#${entry.rank}` : `#${index + 1}`,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 -z-10 opacity-80">
        <div className="absolute left-1/2 top-24 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[160px]" />
        <div className="absolute bottom-12 left-12 h-80 w-80 rounded-full bg-emerald-500/25 blur-[140px]" />
        <div className="absolute bottom-16 right-6 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16 sm:px-10 lg:py-24">
        <div className="max-w-3xl space-y-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Quiz Journey Showcase
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
            From Hype to Highlight Reel
          </h1>
          <p className="text-sm text-white/70">
            Explore how the quiz detail page drives excitement, dive into the interactive play
            screen, and finish with a celebratory results recap — all powered by live product data.
          </p>
        </div>

        <div className="space-y-24">
          <section className="space-y-10">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                01
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                  Preview
                </p>
                <h2 className="text-2xl font-bold">Set the stage with a cinematic quiz profile</h2>
              </div>
            </div>

            <ShowcaseQuizDetailHero
              badgeLabel={badgeLabel}
              title={quiz.title}
              description={quiz.description}
              metrics={[
                { label: "Time", value: durationLabel },
                { label: "Bonus", value: bonusLabel, accentClass: "text-amber-300" },
                { label: "Players", value: playersLabel, accentClass: "text-emerald-300" },
              ]}
              gradients={gradients}
              playersLabel={playersLabel}
              leaderboardEntries={leaderboardEntries}
              slug={quiz.slug}
            />
          </section>

          <section className="space-y-10">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                02
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                  Play
                </p>
                <h2 className="text-2xl font-bold">Flow through the question experience</h2>
              </div>
            </div>

            <ShowcaseQuizExperienceToggle
              questions={experienceQuestions}
              helperText="Tap an answer to lock it in"
              alternateHelperText="Race the clock and keep your streak alive"
              initialVariant="light"
            />
          </section>

          <section className="space-y-10">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                03
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                  Celebrate
                </p>
                <h2 className="text-2xl font-bold">Show the post-game recap and leaderboard</h2>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
              <ShowcaseQuizResults attempt={latestAttempt} leaderboardData={leaderboardData} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
