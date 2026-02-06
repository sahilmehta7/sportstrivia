import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShowcaseQuizCard2 } from "@/components/quiz/ShowcaseQuizCard2";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import {
  formatQuizDuration,
  getSportGradient,
} from "@/lib/quiz-formatters";

function formatCoachPlaceholder(title: string, index: number) {
  const words = title.split(" ").filter(Boolean);
  const base = words.slice(0, 2).join(" ") || "Quiz Coach";
  const suffix = index % 2 === 0 ? "Coach" : "Trainer";
  return `${base} ${suffix}`;
}

export default async function ShowcaseQuizCard2Page() {
  let cards = [
    {
      id: "demo-1",
      title: "Upper Body Boxing",
      category: "Upper Body",
      durationLabel: "20 min",
      difficultyLabel: "Easy",
      coach: {
        name: "Coach Morgan Green",
        avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      },
      coverImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
      accent: getSportGradient("boxing"),
    },
    {
      id: "demo-2",
      title: "Mindfulness Basics",
      category: "Upper Body",
      durationLabel: "20 min",
      difficultyLabel: "Easy",
      coach: {
        name: "Coach Azunyan Senpai",
        avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      },
      coverImageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
      accent: getSportGradient("yoga", 1),
    },
  ];

  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublished: true,
        status: "PUBLISHED",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 2,
      include: {
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

    if (!quizzes.length) {
      notFound();
    }

    cards = quizzes.map((quiz, index) => {
      const durationSeconds = quiz.duration ?? quiz.timePerQuestion ?? 0;
      const category = quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? "Featured";
      const difficultyLabel = quiz.difficulty
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const coachName = formatCoachPlaceholder(quiz.title, index);
      const accent = getSportGradient(quiz.sport, index) ?? "from-orange-500 to-amber-400";

      return {
        id: quiz.id,
        title: quiz.title,
        category,
        durationLabel: durationSeconds ? formatQuizDuration(durationSeconds) : "Flexible",
        difficultyLabel,
        coach: {
          name: coachName,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(coachName)}`,
        },
        coverImageUrl: quiz.descriptionImageUrl ?? "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
        accent,
      };
    });
  } catch (error) {
    console.warn("[showcase/quiz-card-2] Using fallback data", error);
  }

  return (
    <ShowcaseLayout
      title="Quiz Card Variant"
      subtitle="A compact creator-focused layout with category, difficulty, and coach details"
      badge="QUIZ CARD 2"
      variant="vibrant"
      breadcrumbs={[{ label: "Quiz Cards", href: "/showcase" }, { label: "Quiz Card Variant" }]}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div className="rounded-[2.5rem] border border-white/30 bg-white/80 p-8 shadow-[0_30px_90px_-40px_rgba(249,115,22,0.4)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold uppercase tracking-[0.35em] text-slate-600">
            Short Workouts
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {cards.map((card) => (
              <ShowcaseQuizCard2
                key={card.id}
                title={card.title}
                category={card.category}
                durationLabel={card.durationLabel}
                difficultyLabel={card.difficultyLabel}
                coach={card.coach}
                coverImageUrl={card.coverImageUrl}
                accent={card.accent}
                isBookmarked
              />
            ))}
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
