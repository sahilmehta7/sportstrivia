import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShowcaseQuizExperienceToggle } from "@/components/quiz/ShowcaseQuizExperienceToggle";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { type ShowcaseQuizExperienceQuestion } from "@/components/quiz/ShowcaseQuizExperience";

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
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Experience"
        subtitle="Built on the live quiz attempt APIs, this question screen keeps the pressure on with beautiful gradients, subtle motion, and responsive answer states in light and dark"
        badge="EXPERIENCE SHOWCASE"
        variant="default"
      >
        <ShowcaseQuizExperienceToggle
          questions={showcaseQuestions}
          helperText="Tap an answer to lock it in"
          alternateHelperText="Race the clock and keep your streak alive"
          initialVariant="light"
          className="mx-auto w-full max-w-4xl"
        />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
