import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShowcaseFeaturedQuizCard } from "@/components/quiz/ShowcaseFeaturedQuizCard";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import {
  formatPlayerCount,
  formatQuizDuration,
  getSportGradient,
} from "@/lib/quiz-formatters";

export default async function ShowcaseFeaturedQuizCardPage() {
  let quiz: any;

  try {
    quiz = await prisma.quiz.findFirst({
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
  } catch (error) {
    console.warn("[showcase/featured-quiz-card] Using fallback data", error);
    quiz = {
      title: "Ultimate Cricket Venue Challenge",
      description: "An immersive sprint through global cricket arenas.",
      slug: "demo-cricket-venue",
      sport: "Cricket",
      difficulty: "Medium",
      duration: 1200,
      timePerQuestion: 60,
      averageRating: 4.8,
      _count: { attempts: 12345 },
      topicConfigs: [{ topic: { name: "Cricket" } }],
      descriptionImageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
    };
  }

  const category = quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? "Featured";
  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const playersLabel = `${formatPlayerCount(quiz._count?.attempts ?? 0)} players`;
  const difficultyLabel = (quiz.difficulty ?? "Medium").toString().toLowerCase().replace(/_/g, " ");
  const ratingLabel = quiz.averageRating && quiz.averageRating > 0 ? `${quiz.averageRating.toFixed(1)} / 5` : undefined;
  const accent = getSportGradient(quiz.sport);

  return (
    <ShowcaseLayout
      title="Featured Quiz Card"
      subtitle="A hero-style glassmorphism card that spotlights your marquee quiz"
      badge="FEATURED CARD"
      variant="vibrant"
      breadcrumbs={[{ label: "Quiz Cards", href: "/showcase" }, { label: "Featured Quiz Card" }]}
    >
      <div className="mx-auto flex w-full max-w-5xl justify-center">
        <ShowcaseFeaturedQuizCard
          title={quiz.title}
          subtitle={quiz.description}
          category={category}
          durationLabel={durationLabel}
          difficultyLabel={difficultyLabel}
          playersLabel={playersLabel}
          ratingLabel={ratingLabel}
          coverImageUrl={quiz.descriptionImageUrl ?? undefined}
          accent={accent}
          ctaHref={`/quizzes/${quiz.slug ?? "demo-cricket-venue"}`}
        />
      </div>
    </ShowcaseLayout>
  );
}
