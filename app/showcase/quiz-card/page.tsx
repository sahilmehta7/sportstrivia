import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";

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
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Card"
        subtitle="Interactive quiz cards with sport-specific styling and animations"
        badge="QUIZ CARD SHOWCASE"
        variant="dark"
      >
        <ShowcaseQuizCard
          title={quiz.title}
          badgeLabel={badgeLabel}
          durationLabel={durationLabel}
          playersLabel={playersLabel}
          accent={getSportGradient(quiz.sport)}
          coverImageUrl={quiz.descriptionImageUrl}
        />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
