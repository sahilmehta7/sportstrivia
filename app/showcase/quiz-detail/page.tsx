import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { ShowcaseReviewsPanel } from "@/components/showcase/ui";
import { Star } from "lucide-react";

// formatTimeUntil removed - unused in showcase page

export default async function QuizDetailShowcasePage() {
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
        leaderboard: {
          take: 3,
          orderBy: [
            {
              bestScore: "desc",
            },
            {
              averageResponseTime: "asc",
            },
          ],
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
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
    console.warn("[showcase/quiz-detail] Using fallback data", error);
    quiz = {
      id: "demo-quiz",
      title: "Ultimate Cricket Venue Challenge",
      description: "An immersive sprint through global cricket arenas.",
      descriptionImageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
      slug: "demo-cricket-venue",
      sport: "Cricket",
      difficulty: "MEDIUM",
      duration: 1200,
      timePerQuestion: 60,
      timeBonusEnabled: true,
      bonusPointsPerSecond: 1.2,
      maxAttemptsPerUser: 3,
      attemptResetPeriod: "DAILY",
      _count: { attempts: 12345 },
      topicConfigs: [{ topic: { name: "Cricket" } }],
      leaderboard: [
        { user: { name: "Alex Johnson", email: "alex@example.com" }, bestScore: 96.0, bestPoints: 9600, rank: 1 },
        { user: { name: "Priya Singh", email: "priya@example.com" }, bestScore: 93.2, bestPoints: 9320, rank: 2 },
        { user: { name: "Diego Morales", email: "diego@example.com" }, bestScore: 92.1, bestPoints: 9210, rank: 3 },
      ],
    };
  }

  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  
  // Difficulty indicator using sport trophy emojis
  const getDifficultyIndicator = (difficulty?: string) => {
    const d = difficulty?.toUpperCase();
    const trophy = "🏆";
    
    // Return 3 trophy emojis with different opacity based on difficulty
    if (d === "EASY") return (
      <span className="text-2xl">
        <span className="opacity-100">{trophy}</span>
        <span className="opacity-30">{trophy}</span>
        <span className="opacity-30">{trophy}</span>
      </span>
    );
    if (d === "MEDIUM") return (
      <span className="text-2xl">
        <span className="opacity-100">{trophy}</span>
        <span className="opacity-100">{trophy}</span>
        <span className="opacity-30">{trophy}</span>
      </span>
    );
    // HARD - all 3 trophies at full opacity
    return (
      <span className="text-2xl">
        <span className="opacity-100">{trophy}</span>
        <span className="opacity-100">{trophy}</span>
        <span className="opacity-100">{trophy}</span>
      </span>
    );
  };
  
  const playersLabel = formatPlayerCount(quiz._count?.attempts);
  const badgeLabel =
    quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured";
  
  // Calculate attempts info for the attempts bar
  const maxAttempts = quiz.maxAttemptsPerUser || null;

  const leaderboardEntries = quiz.leaderboard.map((entry: any, index: number) => ({
    name:
      entry.user?.name ||
      entry.user?.email?.split("@")[0] ||
      `Player ${index + 1}`,
    score: Math.round(entry.bestScore || entry.bestPoints || 0),
    rank: entry.rank && entry.rank < 999999 ? entry.rank : index + 1,
  }));

  const highlightedTitle = quiz.title.split(" ");
  const firstWord = highlightedTitle.shift() ?? quiz.title;
  const remainderTitle = highlightedTitle.join(" ");
  const averageRating = 4.3; // showcase demo value
  const totalReviews = 128; // showcase demo value

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4 py-12 dark:from-slate-900 dark:via-purple-900 dark:to-amber-500 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px] dark:bg-emerald-400/40" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/20 blur-[100px] dark:bg-pink-500/40" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[90px] dark:bg-blue-500/30" />
      </div>

      <div className="relative w-full max-w-5xl rounded-[1.75rem] border border-slate-200/60 bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80 p-6 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-black/70 dark:via-slate-900/60 dark:to-indigo-900/80 dark:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
          <div className="flex-1 text-center lg:text-left">
            {/* Mobile cover image above title */}
            {quiz.descriptionImageUrl && (
              <div className="relative mb-4 w-full overflow-hidden rounded-2xl lg:hidden h-48">
                <Image
                  src={quiz.descriptionImageUrl}
                  alt={quiz.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/30" />
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/40 bg-white/60 px-4 py-1 text-xs uppercase tracking-[0.35em] text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-white/70">
              {badgeLabel.toUpperCase()}
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-slate-900 drop-shadow-[0_16px_32px_rgba(32,32,48,0.15)] dark:text-white sm:text-5xl lg:text-6xl">
              {firstWord}
              {remainderTitle && <span className="text-emerald-600 dark:text-emerald-300"> {remainderTitle}</span>}
            </h1>

            <p className="mt-4 mx-auto max-w-2xl text-xs text-slate-700 dark:text-white/75 sm:text-sm lg:mx-0">
              {quiz.description
                ? quiz.description
                : "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Time</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{durationLabel}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Difficulty</p>
                <div className="flex items-center gap-2">
                  {getDifficultyIndicator(quiz.difficulty)}
                  <span className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{quiz.difficulty || "MEDIUM"}</span>
                </div>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Players</p>
                <p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-300">{playersLabel}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
              <div className="flex -space-x-2 sm:-space-x-3">
                {[getSportGradient(quiz.sport, 0), getSportGradient(quiz.sport, 1), getSportGradient(quiz.sport, 2)].map((gradient, index) => (
                  <div
                    key={`${gradient}-${index}`}
                    className={`relative h-8 w-8 rounded-full border-2 border-slate-300/60 bg-gradient-to-br dark:border-white/30 sm:h-9 sm:w-9 lg:h-10 lg:w-10 ${gradient}`}
                  >
                    <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-black/20" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-xs text-slate-700 dark:text-white/70">
                  Join <span className="font-semibold text-slate-900 dark:text-white">{playersLabel}</span> players competing
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${index < Math.round(averageRating) ? "fill-current" : "opacity-30"}`}
                        fill={index < Math.round(averageRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-800 dark:text-white/80">{averageRating.toFixed(1)} ({totalReviews})</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href={`/quizzes/${quiz.slug}/play`}>
                <ShowcaseButton className="px-6 py-3 text-sm">
                  Start Quiz
                </ShowcaseButton>
              </Link>
            </div>

            {/* Mobile: Compact Attempts bar just below CTA */}
            <div className="mt-3 lg:hidden">
              <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/20 via-amber-400/25 to-emerald-400/25 p-[1px]">
                <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/80">
                  {maxAttempts ? (
                    <>
                      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/60">
                        Attempts Remaining
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-300/50 dark:bg-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500"
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-slate-900 dark:text-white">{maxAttempts}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">Max</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/60">
                        Unlimited Attempts
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">∞</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex w-full max-w-md flex-col items-stretch gap-6 rounded-[1.75rem] border border-slate-200/60 bg-white/80 p-6 text-slate-900 shadow-[0_40px_80px_-40px_rgba(59,130,246,0.15)] backdrop-blur-3xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_40px_80px_-40px_rgba(15,15,35,0.7)] sm:p-8 lg:max-w-sm">
            {/* Cover Image */}
            {quiz.descriptionImageUrl && (
              <div className="relative hidden w-full overflow-hidden rounded-2xl lg:block h-48">
                <Image 
                  src={quiz.descriptionImageUrl} 
                  alt={quiz.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 600px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/40" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-white/50">Leaderboard</span>
              <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-700 dark:bg-white/10 dark:text-white/70">Live</span>
            </div>

            <div className="space-y-4 text-sm">
              {(leaderboardEntries.length ? leaderboardEntries : [
                { name: "Be the first", score: 0, rank: "" },
              ]).map((player: any, index: number) => (
                <div
                  key={`${player.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{player.name}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-600 dark:text-white/40">Score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{player.score}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">{player.rank ? `#${player.rank}` : "Join"}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto hidden rounded-2xl bg-gradient-to-r from-fuchsia-500/20 via-amber-400/30 to-emerald-400/30 p-[1px] dark:from-fuchsia-500/30 dark:via-amber-400/40 dark:to-emerald-400/40 lg:block">
              <div className="rounded-2xl bg-white/70 p-6 dark:bg-slate-900/80">
                {maxAttempts ? (
                  <>
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/50">
                      Attempts Remaining
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-300/40 dark:bg-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 dark:from-emerald-400 dark:to-emerald-500"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {maxAttempts}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 dark:text-white/50">Max</p>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-xs text-slate-700 dark:text-white/60">
                      {quiz.attemptResetPeriod === 'NEVER' 
                        ? 'Limit applies forever'
                        : `Resets ${quiz.attemptResetPeriod?.toLowerCase() || 'daily'}`}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/50">
                      Unlimited Attempts
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">∞</p>
                    <p className="mt-3 text-xs text-slate-700 dark:text-white/60">
                      Take the quiz as many times as you want
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Removed ratings/breakdown blocks from sidebar per design */}
          </div>
        </div>
      </div>
      {/* Reviews section below the overall quiz detail section */}
      <div className="mx-auto mt-6 w-full max-w-5xl rounded-[1.75rem] bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/80 p-4 text-slate-900 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:from-black/70 dark:via-slate-900/60 dark:to-indigo-900/80 dark:text-white sm:p-5 lg:p-6">
        <ShowcaseReviewsPanel
          reviews={[
            {
              id: "1",
              reviewer: { name: "Alex Johnson", role: "Avid Fan" },
              rating: 5,
              quote: "Loved the mix of classic and modern trivia!",
              dateLabel: "2 days ago",
            },
            {
              id: "2",
              reviewer: { name: "Priya Singh", role: "Quiz Enthusiast" },
              rating: 4,
              quote: "Great challenge. A few questions were tough but fair.",
              dateLabel: "1 week ago",
            },
          ]}
          className="bg-transparent border-0 p-0"
        />
      </div>
    </div>
  );
}
