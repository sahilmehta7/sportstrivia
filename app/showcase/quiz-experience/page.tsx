import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ShowcaseQuizExperience,
  type ShowcaseQuizExperienceQuestion,
} from "@/components/quiz/ShowcaseQuizExperience";

export default async function ShowcaseQuizExperiencePage() {
  const quiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      status: "PUBLISHED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
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

  if (!quiz || quiz.questionPool.length === 0) {
    notFound();
  }

  const fallbackTime = quiz.timePerQuestion ?? 5 * 60;

  const showcaseQuestions: ShowcaseQuizExperienceQuestion[] = quiz.questionPool
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

  if (showcaseQuestions.length === 0) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 -z-10 opacity-80">
        <div className="absolute left-1/2 top-24 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[140px]" />
        <div className="absolute bottom-12 left-12 h-72 w-72 rounded-full bg-emerald-500/25 blur-[140px]" />
        <div className="absolute bottom-16 right-6 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16 sm:px-10 lg:py-24">
        <div className="text-center text-white">
          <span className="inline-block rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Quiz Experience
          </span>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Immersive Question Flow
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70">
            Built on the live quiz attempt APIs, this question screen keeps the pressure on with
            beautiful gradients, subtle motion, and responsive answer states in light and dark.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <ShowcaseQuizExperience
            variant="light"
            questions={showcaseQuestions}
            helperText="Tap an answer to lock it in"
          />

          <ShowcaseQuizExperience
            variant="dark"
            helperText="Race the clock and keep your streak alive"
            questions={showcaseQuestions}
          />
        </div>
      </div>
    </div>
  );
}
