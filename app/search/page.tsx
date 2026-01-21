import { type Metadata } from "next";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import { SearchPaginationClient } from "@/components/showcase/ui/SearchPaginationClient";
import { getPublicQuizList, type PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { searchTopics } from "@/lib/services/topic.service";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { validateSearchQuery } from "@/lib/validations/search.schema";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Search, Grid, Database, Zap, Activity, ShieldAlert, Sparkles, MoveRight, ChevronRight, Binary } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Discovery Matrix | Sports Trivia",
  description: "Search and discover sports trivia quizzes by name, sport, topic, tags, and more.",
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
  const validatedSearch = rawSearch ? validateSearchQuery(rawSearch) : null;
  const search = validatedSearch || (rawSearch ? rawSearch.trim() : "");
  const page = Math.max(1, parseInt(getParam("page") || "1", 10) || 1);
  const limit = Math.min(12, Math.max(1, parseInt(getParam("limit") || "12", 10) || 12));

  const { circle1, circle2, circle3 } = getBlurCircles();

  if (!search || search.length === 0) {
    return (
      <ShowcaseThemeProvider>
        <main className="relative min-h-screen overflow-hidden pt-24 pb-24">
          <div className="absolute inset-0 -z-10">{circle1}{circle2}{circle3}</div>
          <PageContainer className="max-w-2xl px-4 py-20 text-center space-y-12">
            <div className="space-y-6">
              <div className="h-20 w-20 mx-auto rounded-[2rem] glass border border-white/10 flex items-center justify-center text-primary shadow-neon-cyan/20">
                <Search className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-4">
                <h1 className={cn("text-5xl font-black uppercase tracking-tighter", getGradientText("neon"))}>DISCOVERY</h1>
                <p className="text-sm font-bold tracking-[0.2em] text-muted-foreground/60 uppercase">INITIATE QUERY TO SCAN THE KNOWLEDGE MATRIX</p>
              </div>
            </div>
          </PageContainer>
        </main>
      </ShowcaseThemeProvider>
    );
  }

  const [listing, topicResults] = await Promise.all([
    getPublicQuizList({ search, page, limit }).catch(() => ({ quizzes: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } })),
    searchTopics({ query: search, limit: 9 }).catch(() => ({ topics: [], pagination: { page: 1, limit: 9, total: 0, pages: 0 } })),
  ]);

  const toCardProps = (quiz: PublicQuizListItem) => {
    const durationLabel = formatQuizDuration(quiz.duration ?? null);
    const playersLabel = `${formatPlayerCount(quiz._count?.attempts)} Players`;
    const badgeLabel = quiz.sport ?? quiz.difficulty ?? "Arena";
    const accent = getSportGradient(quiz.sport);
    return { title: quiz.title, badgeLabel, durationLabel, playersLabel, accent, coverImageUrl: quiz.descriptionImageUrl || undefined } as const;
  };

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">{circle1}{circle2}{circle3}</div>

        <PageContainer className="space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-tight", getGradientText("neon"))}>
                  MATRIX MATCHES
                </h1>
              </div>
              <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase lg:pl-5">
                DISCOVERY INTERFACE • RESULTS FOR &quot;{search.toUpperCase()}&quot;
              </p>
            </div>
          </div>

          {topicResults.topics && topicResults.topics.length > 0 && (
            <section className="space-y-8 p-10 rounded-[3rem] glass border border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-4 w-1 rounded-full bg-secondary shadow-neon-magenta" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Relevant Sectors</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {topicResults.topics.map((t) => (
                  <Link key={t.id} href={`/topics/${t.slug}`}>
                    <div className="px-6 py-2.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground hover:shadow-neon-cyan transition-all">
                      {t.name}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {listing.quizzes.length > 0 ? (
            <div className="space-y-12">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {listing.quizzes.map((quiz: PublicQuizListItem) => (
                  <ShowcaseQuizCard key={quiz.id} {...toCardProps(quiz)} />
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <SearchPaginationClient
                  page={listing.pagination.page}
                  pages={listing.pagination.pages}
                />
              </div>
            </div>
          ) : (
            <div className="py-32 text-center space-y-8 rounded-[3rem] glass border border-dashed border-white/10">
              <div className="h-20 w-20 mx-auto rounded-[2.5rem] glass border border-white/5 flex items-center justify-center text-red-400/20">
                <Binary className="h-10 w-10" />
              </div>
              <div className="space-y-4 max-w-md mx-auto px-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-muted-foreground/40">NO MATRICES DETECTED</h3>
                <p className="text-xs font-bold tracking-widest text-muted-foreground/30 uppercase leading-relaxed">
                  UNABLE TO RESOLVE IDENTIFIER &quot;{search}&quot;. RECONFIGURE QUERY AND ATTEMPT SECONDARY SCAN.
                </p>
              </div>
            </div>
          )}
        </PageContainer>

        {/* Tactical decor */}
        <div className="absolute top-1/4 -right-40 pointer-events-none opacity-[0.02]">
          <Activity className="h-[500px] w-[500px]" />
        </div>
      </main>
    </ShowcaseThemeProvider>
  );
}
