import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { QuizQuestionManager } from "@/components/admin/quizzes/QuizQuestionManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizQuestionsPage({ params }: PageProps) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      questionPool: {
        orderBy: { order: "asc" },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              difficulty: true,
              topic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              answers: {
                orderBy: { displayOrder: "asc" },
                select: {
                  id: true,
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

  const topics = await prisma.topic.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
    },
  });

  const poolQuestions = quiz.questionPool.map((entry) => ({
    poolId: entry.id,
    questionId: entry.questionId,
    order: entry.order ?? 0,
    points: entry.points,
    question: {
      questionText: entry.question.questionText,
      difficulty: entry.question.difficulty,
      answers: entry.question.answers,
      topic: entry.question.topic,
    },
  }));

  return (
    <QuizQuestionManager
      quiz={{ id: quiz.id, title: quiz.title }}
      initialPoolQuestions={poolQuestions}
      topics={topics}
    />
  );
}

