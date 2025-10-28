import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShowcaseQuizExperienceToggle } from "@/components/quiz/ShowcaseQuizExperienceToggle";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { type ShowcaseQuizExperienceQuestion } from "@/components/quiz/ShowcaseQuizExperience";
import { shuffleArray } from "@/lib/utils";

export default async function ShowcaseQuizExperiencePage() {
  let showcaseQuestions: ShowcaseQuizExperienceQuestion[] = [
    {
      id: "demo-q1",
      prompt: "Which city hosted the very first Premier League match?",
      imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20",
      timeLimit: 60,
      timeRemaining: 45,
      answers: [
        { id: "demo-a1", text: "London", isCorrect: false },
        { id: "demo-a2", text: "Sheffield", isCorrect: true },
        { id: "demo-a3", text: "Manchester", isCorrect: false },
        { id: "demo-a4", text: "Birmingham", isCorrect: false },
      ],
      correctAnswerId: "demo-a2",
    },
    {
      id: "demo-q2",
      prompt: "How many substitutions were allowed per team when the league launched?",
      imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
      timeLimit: 60,
      timeRemaining: 50,
      answers: [
        { id: "demo-b1", text: "1", isCorrect: true },
        { id: "demo-b2", text: "2" },
        { id: "demo-b3", text: "3" },
        { id: "demo-b4", text: "No limit" },
      ],
      correctAnswerId: "demo-b1",
    },
  ];

  try {
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

    showcaseQuestions = quiz.questionPool
      .map((entry, index) => {
        const question = entry.question;
        if (!question || question.answers.length === 0) {
          return null;
        }

        const baseTime = question.timeLimit ?? fallbackTime;
        const lowerBound = Math.max(12, Math.floor(baseTime * 0.5));
        const simulatedTime = Math.max(baseTime - index * 12 - 5, lowerBound);

        const correctAnswer = question.answers.find((answer) => answer.isCorrect);
        const shuffledAnswers = shuffleArray(question.answers);

        return {
          id: question.id,
          prompt: question.questionText,
          imageUrl: question.questionImageUrl,
          timeLimit: baseTime,
          timeRemaining: simulatedTime,
          answers: shuffledAnswers.map((answer) => ({
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
  } catch (error) {
    console.warn("[showcase/quiz-experience] Using fallback questions", error);
  }

  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Experience"
        subtitle="Built on the live quiz attempt APIs, this question screen keeps the pressure on with beautiful gradients, subtle motion, and responsive answer states in light and dark"
        badge="EXPERIENCE SHOWCASE"
        variant="default"
        breadcrumbs={[{ label: "Experience", href: "/showcase" }, { label: "Quiz Experience" }]}
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
