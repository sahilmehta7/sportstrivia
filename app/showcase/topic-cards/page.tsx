import { ShowcaseTopicCarousel } from "@/components/quiz/ShowcaseTopicCarousel";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
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
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Topic Explorer"
        subtitle="Discover curated collections of quizzes by theme. Tap a card to dive into the topic detail page"
        badge="TOPIC SHOWCASE"
        variant="vibrant"
        breadcrumbs={[{ label: "Topics", href: "/showcase" }, { label: "Topic Cards" }]}
      >
        <section className="space-y-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.4em] opacity-70">
            Dark Mode
          </h2>
          <ShowcaseTopicCarousel items={items} variant="dark" />
        </section>

        <section className="space-y-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.4em] opacity-70">
            Light Mode
          </h2>
          <ShowcaseTopicCarousel items={items} variant="light" />
        </section>
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
