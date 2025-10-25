import { prisma } from "@/lib/db";
import {
  formatPlayerCount,
  formatQuizDuration,
  getSportGradient,
} from "@/lib/quiz-formatters";
import { ShowcaseQuizCarousel } from "@/components/quiz/ShowcaseQuizCarousel";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { notFound } from "next/navigation";

export default async function QuizCarouselShowcasePage() {
  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 8,
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

  if (quizzes.length === 0) {
    notFound();
  }

  const items = quizzes.map((quiz, index) => ({
    id: quiz.id,
    title: quiz.title,
    badgeLabel: quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured",
    durationLabel: formatQuizDuration(quiz.duration ?? quiz.timePerQuestion),
    playersLabel: formatPlayerCount(quiz._count?.attempts),
    accent: getSportGradient(quiz.sport, index),
    coverImageUrl: quiz.descriptionImageUrl,
  }));

  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Quiz Carousel"
        subtitle="Swipe through featured leagues and jump straight into the action"
        badge="CAROUSEL SHOWCASE"
        variant="vibrant"
      >
        <ShowcaseQuizCarousel items={items} />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
