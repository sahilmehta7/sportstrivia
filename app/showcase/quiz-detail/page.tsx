import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPlayerCount, formatQuizDuration, getSportGradient } from "@/lib/quiz-formatters";

function formatTimeUntil(date?: Date | null) {
  if (!date) return "Soon";
  const now = new Date();
  if (date <= now) return "Live";

  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours <= 0 && minutes <= 0) {
    return "Starting";
  }

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

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
              bestPoints: "desc",
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
      slug: "demo-cricket-venue",
      sport: "Cricket",
      difficulty: "Medium",
      duration: 1200,
      timePerQuestion: 60,
      timeBonusEnabled: true,
      bonusPointsPerSecond: 1.2,
      _count: { attempts: 12345 },
      topicConfigs: [{ topic: { name: "Cricket" } }],
      leaderboard: [
        { user: { name: "Alex Johnson", email: "alex@example.com" }, bestPoints: 9600, rank: 1 },
        { user: { name: "Priya Singh", email: "priya@example.com" }, bestPoints: 9320, rank: 2 },
        { user: { name: "Diego Morales", email: "diego@example.com" }, bestPoints: 9210, rank: 3 },
      ],
    };
  }

  const durationLabel = formatQuizDuration(quiz.duration ?? quiz.timePerQuestion);
  const bonusLabel = quiz.timeBonusEnabled && quiz.bonusPointsPerSecond > 0
    ? `+${quiz.bonusPointsPerSecond.toFixed(1)} pts/s`
    : "Streak Safe";
  const playersLabel = formatPlayerCount(quiz._count?.attempts);
  const badgeLabel =
    quiz.topicConfigs?.[0]?.topic?.name ?? quiz.sport ?? quiz.difficulty ?? "Featured";

  const leaderboardEntries = quiz.leaderboard.map((entry, index) => ({
    name:
      entry.user?.name ||
      entry.user?.email?.split("@")[0] ||
      `Player ${index + 1}`,
    score: Math.round(entry.bestPoints),
    rank: entry.rank && entry.rank < 999999 ? entry.rank : index + 1,
  }));

  const highlightedTitle = quiz.title.split(" ");
  const firstWord = highlightedTitle.shift() ?? quiz.title;
  const remainderTitle = highlightedTitle.join(" ");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="relative w-full max-w-5xl rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              {badgeLabel.toUpperCase()}
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)] sm:text-5xl lg:text-6xl">
              {firstWord}
              {remainderTitle && <span className="text-emerald-300"> {remainderTitle}</span>}
            </h1>

            <p className="mt-6 mx-auto max-w-2xl text-sm text-white/75 lg:mx-0">
              {quiz.description
                ? quiz.description
                : "Blitz through fresh trivia curated for diehard fans. Battle against the clock and climb your league leaderboard."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Time</p>
                <p className="text-3xl font-semibold text-white">{durationLabel}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Bonus</p>
                <p className="text-3xl font-semibold text-amber-300">{bonusLabel}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Players</p>
                <p className="text-3xl font-semibold text-emerald-300">{playersLabel}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div className="flex -space-x-3">
                {[getSportGradient(quiz.sport, 0), getSportGradient(quiz.sport, 1), getSportGradient(quiz.sport, 2), getSportGradient(quiz.sport, 3)].map((gradient, index) => (
                  <div
                    key={`${gradient}-${index}`}
                    className={`relative h-12 w-12 rounded-full border-2 border-white/30 bg-gradient-to-br ${gradient}`}
                  >
                    <div className="absolute inset-0 rounded-full bg-black/20" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/70">
                Join <span className="font-semibold text-white">{playersLabel}</span> players competing
              </p>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href={`/quizzes/${quiz.slug}/play`}
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-slate-900 shadow-lg shadow-pink-500/25 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-amber-500/40"
              >
                Start Quiz
                <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href={`/quizzes/${quiz.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/60 hover:text-white"
              >
                View details
              </Link>
            </div>
          </div>

          <div className="relative flex w-full max-w-md flex-col items-stretch gap-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_40px_80px_-40px_rgba(15,15,35,0.7)] backdrop-blur-3xl sm:p-8 lg:max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.35em] text-white/50">Leaderboard</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Live</span>
            </div>

            <div className="space-y-4 text-sm">
              {(leaderboardEntries.length ? leaderboardEntries : [
                { name: "Be the first", score: 0, rank: "" },
              ]).map((player, index) => (
                <div
                  key={`${player.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div>
                    <p className="font-semibold text-white">{player.name}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-300">{player.score}</p>
                    <p className="text-xs text-amber-300">{player.rank ? `#${player.rank}` : "Join"}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-2xl bg-gradient-to-r from-fuchsia-500/30 via-amber-400/40 to-emerald-400/40 p-[1px]">
              <div className="rounded-2xl bg-slate-900/80 p-6 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Next League Drop</p>
                <p className="mt-2 text-3xl font-black text-white">{formatTimeUntil(quiz.endTime)}</p>
                <p className="mt-4 text-xs text-white/70">
                  {quiz.endTime
                    ? "Finish before the clock resets to lock in your ranking."
                    : "New challenges unlock soon—stay warmed up."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
