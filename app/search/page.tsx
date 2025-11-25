import { type Metadata } from "next";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcasePage } from "@/components/showcase/ShowcasePage";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { SearchPaginationClient } from "@/components/showcase/ui/SearchPaginationClient";
import { getPublicQuizList, type PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { searchTopics } from "@/lib/services/topic.service";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { validateSearchQuery } from "@/lib/validations/search.schema";

export const metadata: Metadata = {
  title: "Search results | Sports Trivia",
  description: "Search and discover sports trivia quizzes by name, sport, topic, tags, and more. Find your perfect quiz challenge from thousands of questions across football, cricket, basketball, tennis, and other sports.",
  keywords: ["search quizzes", "sports trivia search", "find quizzes", "quiz search", "sports trivia"],
  openGraph: {
    title: "Search Sports Trivia Quizzes",
    description: "Search and discover sports trivia quizzes by name, sport, topic, tags, and more. Find your perfect quiz challenge from thousands of questions.",
    type: "website",
    url: "/search",
  },
  alternates: {
    canonical: "/search",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const getParam = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const rawSearch = getParam("search") || "";
  // Validate and sanitize search query (same as API)
  // If validation fails, fall back to trimmed raw search to avoid losing queries
  const validatedSearch = rawSearch ? validateSearchQuery(rawSearch) : null;
  const search = validatedSearch || (rawSearch ? rawSearch.trim() : "");
  const page = Math.max(1, parseInt(getParam("page") || "1", 10) || 1);
  const limit = Math.min(12, Math.max(1, parseInt(getParam("limit") || "12", 10) || 12));

  if (!search || search.length === 0) {
    // If no query, show a friendly nudge
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Search</h1>
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Start typing in the search bar above to find quizzes.
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Fetch quizzes and topics in parallel
  const [listing, topicResults] = await Promise.all([
    getPublicQuizList({ search, page, limit }).catch(() => {
      return { quizzes: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } };
    }),
    searchTopics({ query: search, limit: 9 }).catch(() => {
      return { topics: [], pagination: { page: 1, limit: 9, total: 0, pages: 0 } };
    }),
  ]);

  const toCardProps = (quiz: PublicQuizListItem) => {
    const durationLabel = formatQuizDuration(quiz.duration ?? null);
    const playersLabel = `${formatPlayerCount(quiz._count?.attempts)} players`;
    const badgeLabel = quiz.sport ?? quiz.difficulty ?? (quiz.tags?.[0]?.tag?.name ?? "Featured");
    const accent = getSportGradient(quiz.sport);
    return {
      title: quiz.title,
      badgeLabel,
      durationLabel,
      playersLabel,
      accent,
      coverImageUrl: quiz.descriptionImageUrl || undefined,
    } as const;
  };

  return (
    <ShowcaseThemeProvider>
      <ShowcasePage
        title="Search results"
        subtitle={`for “${search}”`}
      >
        {topicResults.topics && topicResults.topics.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="text-lg font-semibold">Matching Topics</h2>
            <div className="flex flex-wrap gap-2">
              {topicResults.topics.map((t) => (
                <a
                  key={t.id}
                  href={`/topics/${t.slug}`}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent transition-colors"
                  aria-label={`Browse ${t.name} topic quizzes`}
                >
                  {t.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {listing.quizzes.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listing.quizzes.map((quiz: PublicQuizListItem) => (
                <ShowcaseQuizCard key={quiz.id} {...toCardProps(quiz)} />
              ))}
            </div>

            <SearchPaginationClient
              page={listing.pagination.page}
              pages={listing.pagination.pages}
            />
          </div>
        ) : (
          <Card className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
            <CardHeader>
              <CardTitle>No results</CardTitle>
              <CardDescription>
                We couldn’t find quizzes matching “{search}”. Try a different term.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tip: search for team, player, league, or topic names.
              </p>
            </CardContent>
          </Card>
        )}
      </ShowcasePage>
    </ShowcaseThemeProvider>
  );
}


