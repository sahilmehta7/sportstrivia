import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";

export default async function QuizCardShowcasePage() {
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
          accent={getSportGradient(quiz.sport)}
          coverImageUrl={quiz.descriptionImageUrl}
        />
      </div>
    );
  } catch (error) {
    console.warn("[showcase/quiz-card] Using fallback data", error);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <ShowcaseQuizCard
        title="Legends of the Premier League"
        badgeLabel="Football"
        durationLabel="20 min"
        playersLabel="12.3k players"
        accent={getSportGradient("football")}
        coverImageUrl="https://images.unsplash.com/photo-1522778119026-d647f0596c20"
      />
    </div>
  );
}
