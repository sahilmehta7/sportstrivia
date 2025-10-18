import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { formatPlayerCount, formatQuizDuration, getSportGradient, getSportIcon } from "@/lib/quiz-formatters";

export default async function QuizCardShowcasePage() {
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
    notFound();
  }

  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = formatPlayerCount(quiz._count?.attempts);
  const badgeLabel =
    quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <ShowcaseQuizCard
        title={quiz.title}
        badgeLabel={badgeLabel}
        durationLabel={durationLabel}
        playersLabel={playersLabel}
        icon={getSportIcon(quiz.sport)}
        accent={getSportGradient(quiz.sport)}
        coverImageUrl={quiz.descriptionImageUrl}
      />
    </div>
  );
}
