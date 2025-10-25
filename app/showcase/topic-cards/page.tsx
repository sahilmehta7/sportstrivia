import { ShowcaseTopicCarousel } from "@/components/quiz/ShowcaseTopicCarousel";
import { prisma } from "@/lib/db";

const colorPairs = [
  { dark: "#7c2d12", light: "#fde68a" },
  { dark: "#065f46", light: "#bbf7d0" },
  { dark: "#1e3a8a", light: "#bfdbfe" },
  { dark: "#7c3aed", light: "#e9d5ff" },
  { dark: "#9d174d", light: "#fecdd3" },
  { dark: "#0f172a", light: "#cbd5f5" },
  { dark: "#14532d", light: "#bef264" },
  { dark: "#92400e", light: "#fed7aa" },
];

export default async function ShowcaseTopicCardsPage() {
  const topics = await prisma.topic.findMany({
    where: {
      parentId: null,
    },
    orderBy: {
      name: "asc",
    },
    take: 12,
  });

  const items = topics.map((topic, index) => ({
    id: topic.id,
    title: topic.name,
    description: topic.description,
    href: `/topics/${topic.slug}`,
    accentDark: colorPairs[index % colorPairs.length].dark,
    accentLight: colorPairs[index % colorPairs.length].light,
  }));

  return (
    <div className="relative flex min-h-screen flex-col gap-16 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:px-12">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center text-white">
        <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">Topic Explorer</h1>
        <p className="mt-4 text-sm text-white/80">
          Discover curated collections of quizzes by theme. Tap a card to dive into the topic detail page.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
          Dark Mode
        </h2>
        <ShowcaseTopicCarousel items={items} variant="dark" />
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
          Light Mode
        </h2>
        <ShowcaseTopicCarousel items={items} variant="light" />
      </section>
    </div>
  );
}
