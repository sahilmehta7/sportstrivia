import "server-only";

import { prisma } from "@/lib/db";
import {
  isPersonalizedHomeDiagnosticsEnabled,
  isPersonalizedHomePlayStyleBoostEnabled,
} from "@/lib/feature-flags";
import { listPublishedCollectionsSafe } from "@/lib/services/collection.service";
import { getInterestProfileForUser } from "@/lib/services/interest-profile.service";
import { getDescendantTopicIdsForMultiple } from "@/lib/services/topic.service";
import { getMaxGuesses, getGameTypeDisplayName, getISTDateString } from "@/lib/utils/daily-game-logic";
import { getTodaysGame } from "@/lib/services/daily-game.service";
import type {
  PersonalizedHomePayload,
  PersonalizedHomeQuizItem,
  PersonalizedHomeRail,
  PersonalizedHomeTrendScope,
} from "@/types/personalized-home";

const MAX_VISIBLE_RAILS = 5;
const MAX_RAIL_ITEMS = 8;
const MAX_TOP_SPORT_RAILS = 2;
const MIN_ITEMS_FOR_PERSONALIZED_RAIL = 3;
const MIN_EFFECTIVE_SCORE = 60;
const CONTINUE_LIMIT = 5;
const MIN_PLAY_STYLE_EVIDENCE = 3;

type QuizCandidate = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  duration: number | null;
  descriptionImageUrl: string | null;
  sport: string | null;
  playMode: string;
  recurringType: string;
  topicConfigs: Array<{
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
};

type TrendingCandidateResult = {
  candidates: QuizCandidate[];
  trendScope: PersonalizedHomeTrendScope;
  scopedCandidateCount: number;
  sportScopedAttempted: boolean;
  forcePlatformFallback: boolean;
};

type DurationBand = "SHORT" | "MEDIUM" | "LONG";

export type UserPlayStyleProfile = {
  evidenceCount: number;
  topPlayMode: string | null;
  topRecurringType: string | null;
  topDifficulty: string | null;
  preferredDurationBand: DurationBand | null;
};

type PlayStyleAttemptSignal = {
  playMode: string;
  recurringType: string;
  difficulty: string;
  duration: number | null;
};

export type PersonalizationDiagnostics = {
  trendScopeReason:
    | "SPORT_SCOPED_SUCCESS"
    | "NO_TOP_SPORTS"
    | "NO_SCOPED_RESULTS"
    | "FORCED_PLATFORM_FALLBACK"
    | "PLATFORM_FALLBACK";
  railEligibility: Record<
    PersonalizedHomeRail["kind"],
    {
      status: "SHOWN" | "HIDDEN";
      reason?: "NO_SEEDS" | "NO_CANDIDATES" | "DEDUPED_BELOW_THRESHOLD";
    }
  >;
  playStyle: {
    status: "DISABLED" | "INSUFFICIENT_EVIDENCE" | "APPLIED";
    evidenceCount: number;
  };
};

type TopicNodeLite = {
  id: string;
  parentId: string | null;
  schemaType: string;
};

const MAX_TOPIC_ANCESTOR_DEPTH = 12;

const RAIL_PRIORITY_ORDER: PersonalizedHomeRail["kind"][] = [
  "FROM_YOUR_FOLLOWS",
  "RELATED_TO_YOUR_FOLLOWS",
  "FROM_YOUR_FAVORITE_TEAMS",
  "FROM_YOUR_FAVORITE_ATHLETES",
  "BECAUSE_YOU_LIKE",
  "MORE_FROM_YOUR_TOP_SPORTS",
  "NEW_IN_YOUR_GRAPH",
  "UNEXPLORED_IN_YOUR_SPORTS",
  "ONBOARDING_PICKS",
  "TRENDING_IN_YOUR_SPORTS",
];

function lastPlayedLabel(date: Date): string {
  const now = new Date();
  const played = new Date(date);
  const diffMs = now.getTime() - played.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function calcConsecutiveDayStreak(dayTimestamps: number[]): number {
  if (dayTimestamps.length === 0) return 0;
  const sortedUnique = Array.from(new Set(dayTimestamps)).sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < sortedUnique.length; i += 1) {
    const prev = sortedUnique[i - 1];
    const cur = sortedUnique[i];
    const diffDays = Math.round((prev - cur) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function buildDaysOfWeek(dayTimestamps: number[]): boolean[] {
  const days = new Array<boolean>(7).fill(false);
  for (const ts of dayTimestamps) {
    const d = new Date(ts);
    days[d.getDay()] = true;
  }
  return days;
}

function dedupeQuizItems(items: PersonalizedHomeQuizItem[], seen: Set<string>): PersonalizedHomeQuizItem[] {
  const next: PersonalizedHomeQuizItem[] = [];
  for (const item of items) {
    if (seen.has(item.quizId)) continue;
    seen.add(item.quizId);
    next.push(item);
  }
  return next;
}

export function shouldUseSportScopedTrending(preferredSports: string[], forcePlatform: boolean): boolean {
  return !forcePlatform && preferredSports.length >= 1;
}

export function buildExpandedTopicSeedIds(input: {
  seedTopicIds: string[];
  descendantsByTopicId: Map<string, string[]>;
  nearestSportAncestorByTopicId: Map<string, string>;
}): string[] {
  const ordered = new Set<string>();

  for (const seedTopicId of input.seedTopicIds) {
    ordered.add(seedTopicId);
    const descendants = input.descendantsByTopicId.get(seedTopicId) ?? [];
    for (const descendantId of descendants) {
      ordered.add(descendantId);
    }
    const sportAncestorId = input.nearestSportAncestorByTopicId.get(seedTopicId);
    if (sportAncestorId) {
      ordered.add(sportAncestorId);
    }
  }

  return Array.from(ordered);
}

function getDurationBand(durationSeconds: number | null): DurationBand | null {
  if (durationSeconds === null || durationSeconds <= 0) return null;
  if (durationSeconds <= 180) return "SHORT";
  if (durationSeconds <= 420) return "MEDIUM";
  return "LONG";
}

function getTopKey(counts: Map<string, number>): string | null {
  let maxKey: string | null = null;
  let maxCount = 0;
  for (const [key, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
    }
  }
  return maxKey;
}

export function buildUserPlayStyleProfileFromAttempts(
  attempts: PlayStyleAttemptSignal[],
  minEvidence = MIN_PLAY_STYLE_EVIDENCE
): UserPlayStyleProfile | null {
  if (attempts.length < minEvidence) {
    return null;
  }

  const playModeCounts = new Map<string, number>();
  const recurringCounts = new Map<string, number>();
  const difficultyCounts = new Map<string, number>();
  const durationBandCounts = new Map<string, number>();

  for (const attempt of attempts) {
    playModeCounts.set(attempt.playMode, (playModeCounts.get(attempt.playMode) ?? 0) + 1);
    recurringCounts.set(attempt.recurringType, (recurringCounts.get(attempt.recurringType) ?? 0) + 1);
    difficultyCounts.set(attempt.difficulty, (difficultyCounts.get(attempt.difficulty) ?? 0) + 1);
    const durationBand = getDurationBand(attempt.duration);
    if (durationBand) {
      durationBandCounts.set(durationBand, (durationBandCounts.get(durationBand) ?? 0) + 1);
    }
  }

  return {
    evidenceCount: attempts.length,
    topPlayMode: getTopKey(playModeCounts),
    topRecurringType: getTopKey(recurringCounts),
    topDifficulty: getTopKey(difficultyCounts),
    preferredDurationBand: (getTopKey(durationBandCounts) as DurationBand | null) ?? null,
  };
}

export function rankCandidatesWithPlayStyleBoost(
  candidates: QuizCandidate[],
  profile: UserPlayStyleProfile | null
): QuizCandidate[] {
  if (!profile) return candidates;

  const scored = candidates.map((candidate, index) => {
    let score = 0;
    if (profile.topPlayMode && candidate.playMode === profile.topPlayMode) score += 3;
    if (profile.topRecurringType && candidate.recurringType === profile.topRecurringType) score += 2;
    if (profile.topDifficulty && candidate.difficulty === profile.topDifficulty) score += 1;
    if (profile.preferredDurationBand && getDurationBand(candidate.duration) === profile.preferredDurationBand) score += 1;
    return { candidate, score, index };
  });

  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  return scored.map((entry) => entry.candidate);
}

export function buildPersonalizationDiagnostics(input: {
  trendScope: PersonalizedHomeTrendScope;
  hasPersonalizedRails: boolean;
  topSportsCount: number;
  scopedTrendingCandidateCount: number;
  sportScopedAttempted: boolean;
  forcePlatformFallback: boolean;
  railEligibility: PersonalizationDiagnostics["railEligibility"];
  playStyleBoostEnabled: boolean;
  playStyleEvidenceCount: number;
}): PersonalizationDiagnostics {
  let trendScopeReason: PersonalizationDiagnostics["trendScopeReason"] = "PLATFORM_FALLBACK";
  if (input.trendScope === "SPORT_SCOPED") {
    trendScopeReason = "SPORT_SCOPED_SUCCESS";
  } else if (input.forcePlatformFallback) {
    trendScopeReason = "FORCED_PLATFORM_FALLBACK";
  } else if (input.topSportsCount === 0) {
    trendScopeReason = "NO_TOP_SPORTS";
  } else if (input.sportScopedAttempted && input.scopedTrendingCandidateCount === 0) {
    trendScopeReason = "NO_SCOPED_RESULTS";
  }

  return {
    trendScopeReason,
    railEligibility: input.railEligibility,
    playStyle: {
      status: !input.playStyleBoostEnabled
        ? "DISABLED"
        : input.playStyleEvidenceCount < MIN_PLAY_STYLE_EVIDENCE
          ? "INSUFFICIENT_EVIDENCE"
          : "APPLIED",
      evidenceCount: input.playStyleEvidenceCount,
    },
  };
}

export function buildDirectFollowQuizItems(
  candidates: QuizCandidate[],
  followsMap: Map<string, { name: string }>
): PersonalizedHomeQuizItem[] {
  const items: PersonalizedHomeQuizItem[] = [];
  for (const quiz of candidates) {
    const followedTopic = quiz.topicConfigs
      .map((config) => followsMap.get(config.topic.id))
      .find((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (!followedTopic) continue;

    items.push(toQuizItem(quiz, `From your follows: ${followedTopic.name}`, "FOLLOWS"));
  }

  return items;
}

function createInitialRailEligibility(): PersonalizationDiagnostics["railEligibility"] {
  return {
    BECAUSE_YOU_LIKE: { status: "HIDDEN", reason: "NO_SEEDS" },
    FROM_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_SEEDS" },
    RELATED_TO_YOUR_FOLLOWS: { status: "HIDDEN", reason: "NO_SEEDS" },
    MORE_FROM_YOUR_TOP_SPORTS: { status: "HIDDEN", reason: "NO_SEEDS" },
    FROM_YOUR_FAVORITE_TEAMS: { status: "HIDDEN", reason: "NO_SEEDS" },
    FROM_YOUR_FAVORITE_ATHLETES: { status: "HIDDEN", reason: "NO_SEEDS" },
    NEW_IN_YOUR_GRAPH: { status: "HIDDEN", reason: "NO_SEEDS" },
    UNEXPLORED_IN_YOUR_SPORTS: { status: "HIDDEN", reason: "NO_SEEDS" },
    ONBOARDING_PICKS: { status: "HIDDEN", reason: "NO_SEEDS" },
    TRENDING_IN_YOUR_SPORTS: { status: "HIDDEN", reason: "NO_SEEDS" },
  };
}

function markRailShown(
  railEligibility: PersonalizationDiagnostics["railEligibility"],
  kind: PersonalizedHomeRail["kind"]
) {
  railEligibility[kind] = { status: "SHOWN" };
}

function markRailSuppressed(
  railEligibility: PersonalizationDiagnostics["railEligibility"],
  kind: PersonalizedHomeRail["kind"],
  reason: "NO_SEEDS" | "NO_CANDIDATES" | "DEDUPED_BELOW_THRESHOLD"
) {
  railEligibility[kind] = { status: "HIDDEN", reason };
}

type SeedAttribution = {
  topicId: string;
  name: string;
};

function buildExpandedSeedAttribution(input: {
  seeds: SeedAttribution[];
  descendantsByTopicId: Map<string, string[]>;
}): {
  expandedTopicIds: string[];
  seedByExpandedTopicId: Map<string, SeedAttribution>;
} {
  const orderedExpandedIds = new Set<string>();
  const seedByExpandedTopicId = new Map<string, SeedAttribution>();

  for (const seed of input.seeds) {
    const candidateTopicIds = [
      seed.topicId,
      ...(input.descendantsByTopicId.get(seed.topicId) ?? []),
    ];

    for (const topicId of candidateTopicIds) {
      orderedExpandedIds.add(topicId);
      if (!seedByExpandedTopicId.has(topicId)) {
        seedByExpandedTopicId.set(topicId, seed);
      }
    }
  }

  return {
    expandedTopicIds: Array.from(orderedExpandedIds),
    seedByExpandedTopicId,
  };
}

function buildSeedAttributedItems(input: {
  candidates: QuizCandidate[];
  sourceKind: PersonalizedHomeQuizItem["sourceKind"];
  reasonPrefix: string;
  seedByExpandedTopicId: Map<string, SeedAttribution>;
}): PersonalizedHomeQuizItem[] {
  const items: PersonalizedHomeQuizItem[] = [];
  for (const quiz of input.candidates) {
    const seed = quiz.topicConfigs
      .map((config) => input.seedByExpandedTopicId.get(config.topic.id))
      .find((entry): entry is SeedAttribution => Boolean(entry));
    if (!seed) continue;
    items.push(toQuizItem(quiz, `${input.reasonPrefix}: ${seed.name}`, input.sourceKind));
  }
  return items;
}

async function getContinuePlaying(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      completedAt: { not: null },
      quiz: {
        recurringType: { not: "NONE" },
        isPublished: true,
        status: "PUBLISHED",
      },
    },
    orderBy: { completedAt: "desc" },
    take: 60,
    select: {
      id: true,
      completedAt: true,
      quiz: {
        select: {
          slug: true,
          title: true,
          descriptionImageUrl: true,
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      id: string;
      title: string;
      slug: string;
      coverImageUrl: string | null;
      latest: Date;
      dayTimestamps: number[];
    }
  >();

  for (const attempt of attempts) {
    if (!attempt.completedAt || !attempt.quiz?.slug || !attempt.quiz?.title) continue;
    const dayTs = new Date(attempt.completedAt).setHours(0, 0, 0, 0);
    const existing = grouped.get(attempt.quiz.slug);

    if (!existing) {
      grouped.set(attempt.quiz.slug, {
        id: attempt.id,
        title: attempt.quiz.title,
        slug: attempt.quiz.slug,
        coverImageUrl: attempt.quiz.descriptionImageUrl ?? null,
        latest: attempt.completedAt,
        dayTimestamps: [dayTs],
      });
      continue;
    }

    existing.dayTimestamps.push(dayTs);
    if (attempt.completedAt > existing.latest) {
      existing.latest = attempt.completedAt;
      existing.id = attempt.id;
      existing.coverImageUrl = attempt.quiz.descriptionImageUrl ?? null;
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.latest.getTime() - a.latest.getTime())
    .slice(0, CONTINUE_LIMIT)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      coverImageUrl: entry.coverImageUrl,
      lastPlayedLabel: lastPlayedLabel(entry.latest),
      streak: calcConsecutiveDayStreak(entry.dayTimestamps),
      daysOfWeek: buildDaysOfWeek(entry.dayTimestamps),
    }));
}

async function getDailyChallenge(userId: string) {
  const game = await getTodaysGame(userId);
  if (!game) return null;

  const maxGuesses = getMaxGuesses(game.gameType);
  const isCompleted = !!(game.userAttempt?.solved || (game.userAttempt?.guessCount ?? 0) >= maxGuesses);

  const startDate = new Date("2026-01-26");
  const today = new Date(getISTDateString());
  const gameNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    gameId: game.id,
    gameType: game.gameType,
    displayName: getGameTypeDisplayName(game.gameType),
    gameNumber,
    isCompleted,
    solved: game.userAttempt?.solved ?? undefined,
    guessCount: game.userAttempt?.guessCount ?? undefined,
    maxGuesses,
  };
}

async function getStarterCollections() {
  const result = await listPublishedCollectionsSafe(
    { page: 1, limit: 3, featured: true },
    "personalized-home"
  );

  return result.collections.slice(0, 3).map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description ?? null,
    coverImageUrl: collection.coverImageUrl ?? null,
  }));
}

export async function resolveNearestSportAncestorByTopicIds(
  topicIds: string[],
  fetchTopicsByIds: (ids: string[]) => Promise<TopicNodeLite[]>,
  maxDepth = MAX_TOPIC_ANCESTOR_DEPTH
): Promise<Map<string, string>> {
  if (topicIds.length === 0) return new Map();

  const nearestSportAncestorByTopicId = new Map<string, string>();
  const topicCache = new Map<string, TopicNodeLite | null>();
  let pendingBySeed = new Map(topicIds.map((topicId) => [topicId, topicId]));

  for (let depth = 0; depth < maxDepth && pendingBySeed.size > 0; depth += 1) {
    const idsToFetch = Array.from(
      new Set(Array.from(pendingBySeed.values()).filter((id) => !topicCache.has(id)))
    );

    if (idsToFetch.length > 0) {
      const fetched = await fetchTopicsByIds(idsToFetch);
      const fetchedById = new Map(fetched.map((topic) => [topic.id, topic]));
      for (const id of idsToFetch) {
        topicCache.set(id, fetchedById.get(id) ?? null);
      }
    }

    const nextPendingBySeed = new Map<string, string>();
    for (const [seedTopicId, cursorTopicId] of pendingBySeed.entries()) {
      if (nearestSportAncestorByTopicId.has(seedTopicId)) continue;
      const cursor = topicCache.get(cursorTopicId);
      if (cursor?.schemaType === "SPORT" && cursor.id !== seedTopicId) {
        nearestSportAncestorByTopicId.set(seedTopicId, cursor.id);
        continue;
      }
      if (!cursor?.parentId) continue;

      const parent = topicCache.get(cursor.parentId);
      if (parent === undefined) {
        nextPendingBySeed.set(seedTopicId, cursor.parentId);
        continue;
      }

      if (!parent) continue;
      if (parent.schemaType === "SPORT") {
        nearestSportAncestorByTopicId.set(seedTopicId, parent.id);
        continue;
      }

      nextPendingBySeed.set(seedTopicId, parent.id);
    }

    pendingBySeed = nextPendingBySeed;
  }

  return nearestSportAncestorByTopicId;
}

async function getNearestSportAncestorByTopicIds(topicIds: string[]): Promise<Map<string, string>> {
  return resolveNearestSportAncestorByTopicIds(topicIds, async (ids) => {
    if (ids.length === 0) return [];

    return prisma.topic.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        parentId: true,
        schemaType: true,
      },
    });
  });
}

async function getRecentPlayStyleSignals(userId: string, limit = 20): Promise<PlayStyleAttemptSignal[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      completedAt: { not: null },
      quiz: {
        isPublished: true,
        status: "PUBLISHED",
      },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      quiz: {
        select: {
          playMode: true,
          recurringType: true,
          difficulty: true,
          duration: true,
        },
      },
    },
  });

  return attempts.map((attempt) => ({
    playMode: attempt.quiz.playMode,
    recurringType: attempt.quiz.recurringType,
    difficulty: attempt.quiz.difficulty,
    duration: attempt.quiz.duration,
  }));
}

async function getQuizCandidatesByTopicIds(userId: string, topicIds: string[], limit = 24): Promise<QuizCandidate[]> {
  if (topicIds.length === 0) return [];

  return prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      topicConfigs: {
        some: {
          topicId: { in: topicIds },
        },
      },
      attempts: {
        none: {
          userId,
          completedAt: { not: null },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      duration: true,
      descriptionImageUrl: true,
      sport: true,
      playMode: true,
      recurringType: true,
      topicConfigs: {
        where: { topicId: { in: topicIds } },
        select: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

async function getQuizCandidatesBySports(userId: string, sports: string[], limit = 24): Promise<QuizCandidate[]> {
  if (sports.length === 0) return [];

  return prisma.quiz.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      sport: { in: sports },
      attempts: {
        none: {
          userId,
          completedAt: { not: null },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      duration: true,
      descriptionImageUrl: true,
      sport: true,
      playMode: true,
      recurringType: true,
      topicConfigs: {
        select: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

async function getAttemptedTopicIds(userId: string): Promise<Set<string>> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    select: {
      quiz: {
        select: {
          topicConfigs: {
            select: {
              topicId: true,
            },
          },
        },
      },
    },
    take: 400,
  });

  const attemptedTopicIds = new Set<string>();
  for (const attempt of attempts) {
    for (const config of attempt.quiz.topicConfigs) {
      attemptedTopicIds.add(config.topicId);
    }
  }

  return attemptedTopicIds;
}

async function getTrendingCandidates(
  userId: string,
  preferredSports: string[],
  options?: { limit?: number; forcePlatform?: boolean }
): Promise<TrendingCandidateResult> {
  const limit = options?.limit ?? 24;
  const forcePlatform = options?.forcePlatform ?? false;
  const sportScoped = shouldUseSportScopedTrending(preferredSports, forcePlatform);

  const whereBase = {
    isPublished: true,
    status: "PUBLISHED" as const,
    attempts: {
      none: {
        userId,
        completedAt: { not: null },
      },
    },
  };

  const query = async (sportFilter: string[] | null) =>
    prisma.quiz.findMany({
      where: {
        ...whereBase,
        ...(sportFilter ? { sport: { in: sportFilter } } : {}),
      },
      orderBy: [
        { attempts: { _count: "desc" } },
        { updatedAt: "desc" },
      ],
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        duration: true,
        descriptionImageUrl: true,
        sport: true,
        playMode: true,
        recurringType: true,
        topicConfigs: {
          select: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 3,
        },
      },
    });

  if (!forcePlatform && sportScoped) {
    const scopedResults = await query(preferredSports);
    if (scopedResults.length > 0) {
      return {
        candidates: scopedResults,
        trendScope: "SPORT_SCOPED",
        scopedCandidateCount: scopedResults.length,
        sportScopedAttempted: true,
        forcePlatformFallback: false,
      };
    }

    return {
      candidates: await query(null),
      trendScope: "PLATFORM",
      scopedCandidateCount: 0,
      sportScopedAttempted: true,
      forcePlatformFallback: false,
    };
  }

  return {
    candidates: await query(null),
    trendScope: "PLATFORM",
    scopedCandidateCount: 0,
    sportScopedAttempted: false,
    forcePlatformFallback: forcePlatform,
  };
}

function toQuizItem(
  quiz: QuizCandidate,
  reasonLabel: string,
  sourceKind: PersonalizedHomeQuizItem["sourceKind"]
): PersonalizedHomeQuizItem {
  return {
    quizId: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    coverImageUrl: quiz.descriptionImageUrl,
    difficulty: quiz.difficulty,
    estimatedDuration: quiz.duration,
    reasonLabel,
    sourceKind,
  };
}

function toRailIdSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function finalizeRail(
  kind: PersonalizedHomeRail["kind"],
  title: string,
  items: PersonalizedHomeQuizItem[],
  dedupeSet: Set<string>,
  trendScope?: PersonalizedHomeTrendScope,
  railId?: string
): PersonalizedHomeRail | null {
  const uniqueItems = dedupeQuizItems(items, dedupeSet).slice(0, MAX_RAIL_ITEMS);
  if (uniqueItems.length === 0) return null;
  return {
    kind,
    ...(railId ? { railId } : {}),
    title,
    ...(trendScope ? { trendScope } : {}),
    items: uniqueItems,
  };
}

export function getTrendingRailPresentation(scope: PersonalizedHomeTrendScope): {
  title: string;
  sourceKind: PersonalizedHomeQuizItem["sourceKind"];
} {
  if (scope === "SPORT_SCOPED") {
    return {
      title: "Trending in Your Sports",
      sourceKind: "TRENDING_SPORT",
    };
  }

  return {
    title: "Trending Now",
    sourceKind: "TRENDING_PLATFORM",
  };
}

export function buildRailOrder(
  railsByKind: Partial<Record<PersonalizedHomeRail["kind"], PersonalizedHomeRail>>,
  maybeMultiRailsOrMax:
    | Partial<Record<PersonalizedHomeRail["kind"], PersonalizedHomeRail[]>>
    | number
    = {},
  maybeMaxVisibleRails = MAX_VISIBLE_RAILS
): PersonalizedHomeRail[] {
  const multiRailsByKind = typeof maybeMultiRailsOrMax === "number" ? {} : maybeMultiRailsOrMax;
  const maxVisibleRails = typeof maybeMultiRailsOrMax === "number" ? maybeMultiRailsOrMax : maybeMaxVisibleRails;
  const orderedRails: PersonalizedHomeRail[] = [];
  for (const kind of RAIL_PRIORITY_ORDER) {
    const multiRails = multiRailsByKind[kind] ?? [];
    if (multiRails.length > 0) {
      orderedRails.push(...multiRails);
      continue;
    }
    const singleRail = railsByKind[kind];
    if (singleRail) {
      orderedRails.push(singleRail);
    }
  }

  return orderedRails.slice(0, maxVisibleRails);
}

export async function getPersonalizedHomePayload(userId: string, now = new Date()): Promise<PersonalizedHomePayload> {
  const [user, profile, continuePlaying, dailyChallenge, recentPlayStyleSignals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        currentStreak: true,
        longestStreak: true,
      },
    }),
    getInterestProfileForUser(userId),
    getContinuePlaying(userId),
    getDailyChallenge(userId),
    getRecentPlayStyleSignals(userId),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const dedupeSet = new Set<string>();
  const railEligibility = createInitialRailEligibility();
  const followsMap = new Map(profile.follows.map((entry) => [entry.topicId, entry]));
  let effectiveTopics = [...profile.follows, ...profile.explicit, ...profile.inferred]
    .filter((entry) => entry.score >= MIN_EFFECTIVE_SCORE)
    .sort((a, b) => b.score - a.score);
  if (effectiveTopics.length === 0) {
    effectiveTopics = [...profile.inferred].sort((a, b) => b.score - a.score).slice(0, 8);
  }

  const effectiveTopicIds = Array.from(new Set(effectiveTopics.map((entry) => entry.topicId))).slice(0, 8);
  const followTopicIds = profile.follows.map((entry) => entry.topicId);
  const teamTopicIds = Array.from(
    new Set(
      profile.follows
        .filter((entry) => entry.schemaType === "SPORTS_TEAM")
        .map((entry) => entry.topicId)
    )
  );
  const athleteTopicIds = Array.from(
    new Set(
      profile.follows
        .filter((entry) => entry.schemaType === "ATHLETE")
        .map((entry) => entry.topicId)
    )
  );
  const onboardingSportTopicIds = profile.explicit
    .filter((entry) => entry.source === "ONBOARDING" && entry.schemaType === "SPORT")
    .map((entry) => entry.topicId);
  const onboardingTopicIds = onboardingSportTopicIds.length > 0
    ? onboardingSportTopicIds
    : profile.explicit
      .filter((entry) => entry.source === "ONBOARDING")
      .map((entry) => entry.topicId);
  const topSports = profile.summary.topSports ?? [];
  const topSportTopicIds = Array.from(
    new Set(
      [...profile.follows, ...profile.explicit, ...profile.inferred]
        .filter((entry) => entry.schemaType === "SPORT" && topSports.includes(entry.name))
        .map((entry) => entry.topicId)
    )
  );

  const expansionSeedTopicIds = Array.from(
    new Set([
      ...effectiveTopicIds,
      ...followTopicIds,
      ...teamTopicIds,
      ...athleteTopicIds,
      ...onboardingTopicIds,
      ...topSportTopicIds,
    ])
  );
  const [descendantsByTopicId, nearestSportAncestorByTopicId] = await Promise.all([
    getDescendantTopicIdsForMultiple(expansionSeedTopicIds),
    getNearestSportAncestorByTopicIds(expansionSeedTopicIds),
  ]);

  const effectiveExpandedTopicIds = buildExpandedTopicSeedIds({
    seedTopicIds: effectiveTopicIds,
    descendantsByTopicId,
    nearestSportAncestorByTopicId,
  }).slice(0, 80);

  const onboardingExpandedTopicIds = buildExpandedTopicSeedIds({
    seedTopicIds: onboardingTopicIds,
    descendantsByTopicId,
    nearestSportAncestorByTopicId,
  }).slice(0, 80);
  const followAttribution = buildExpandedSeedAttribution({
    seeds: profile.follows.map((entry) => ({ topicId: entry.topicId, name: entry.name })),
    descendantsByTopicId,
  });
  const teamAttribution = buildExpandedSeedAttribution({
    seeds: profile.follows
      .filter((entry) => entry.schemaType === "SPORTS_TEAM")
      .map((entry) => ({ topicId: entry.topicId, name: entry.name })),
    descendantsByTopicId,
  });
  const athleteAttribution = buildExpandedSeedAttribution({
    seeds: profile.follows
      .filter((entry) => entry.schemaType === "ATHLETE")
      .map((entry) => ({ topicId: entry.topicId, name: entry.name })),
    descendantsByTopicId,
  });
  const followExpandedTopicIds = followAttribution.expandedTopicIds.slice(0, 80);
  const teamExpandedTopicIds = teamAttribution.expandedTopicIds.slice(0, 80);
  const athleteExpandedTopicIds = athleteAttribution.expandedTopicIds.slice(0, 80);
  const topSportExpandedTopicIds = buildExpandedTopicSeedIds({
    seedTopicIds: topSportTopicIds,
    descendantsByTopicId,
    nearestSportAncestorByTopicId,
  }).slice(0, 80);

  const playStyleBoostEnabled = isPersonalizedHomePlayStyleBoostEnabled();
  const playStyleProfile = playStyleBoostEnabled
    ? buildUserPlayStyleProfileFromAttempts(recentPlayStyleSignals)
    : null;

  const railsByKind: Partial<Record<PersonalizedHomeRail["kind"], PersonalizedHomeRail>> = {};
  const multiRailsByKind: Partial<Record<PersonalizedHomeRail["kind"], PersonalizedHomeRail[]>> = {};
  const primaryPersonalizedKinds: PersonalizedHomeRail["kind"][] = [
    "FROM_YOUR_FOLLOWS",
    "RELATED_TO_YOUR_FOLLOWS",
    "FROM_YOUR_FAVORITE_TEAMS",
    "FROM_YOUR_FAVORITE_ATHLETES",
    "BECAUSE_YOU_LIKE",
    "MORE_FROM_YOUR_TOP_SPORTS",
    "NEW_IN_YOUR_GRAPH",
    "UNEXPLORED_IN_YOUR_SPORTS",
  ];

  if (effectiveExpandedTopicIds.length > 0) {
    let becauseCandidates = await getQuizCandidatesByTopicIds(userId, effectiveExpandedTopicIds, 28);
    becauseCandidates = rankCandidatesWithPlayStyleBoost(becauseCandidates, playStyleProfile);

    if (becauseCandidates.length > 0) {
      const effectiveTopicMap = new Map(effectiveTopics.map((topic) => [topic.topicId, topic]));
      const becauseItems = becauseCandidates.map((quiz) => {
        const rankedTopic = quiz.topicConfigs
          .map((config) => effectiveTopicMap.get(config.topic.id))
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          .sort((a, b) => b.score - a.score)[0];

        if (!rankedTopic) {
          return toQuizItem(quiz, "Because this matches your interests", "INTEREST_PROFILE");
        }

        const prefix = followsMap.has(rankedTopic.topicId) ? "Because you follow" : "Because you like";
        return toQuizItem(quiz, `${prefix} ${rankedTopic.name}`, "INTEREST_PROFILE");
      });

      const becauseRail = finalizeRail("BECAUSE_YOU_LIKE", "Because You Like", becauseItems, dedupeSet);
      if (!becauseRail || becauseRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "BECAUSE_YOU_LIKE", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "BECAUSE_YOU_LIKE");
        railsByKind.BECAUSE_YOU_LIKE = becauseRail;
      }
    } else {
      markRailSuppressed(railEligibility, "BECAUSE_YOU_LIKE", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "BECAUSE_YOU_LIKE", "NO_SEEDS");
  }

  if (followTopicIds.length > 0) {
    let followCandidates = await getQuizCandidatesByTopicIds(userId, followTopicIds, 28);
    followCandidates = rankCandidatesWithPlayStyleBoost(followCandidates, playStyleProfile);

    if (followCandidates.length > 0) {
      const followItems = buildDirectFollowQuizItems(followCandidates, followsMap);

      const followsRail = finalizeRail("FROM_YOUR_FOLLOWS", "From Your Follows", followItems, dedupeSet);
      if (!followsRail || followsRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "FROM_YOUR_FOLLOWS", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "FROM_YOUR_FOLLOWS");
        railsByKind.FROM_YOUR_FOLLOWS = followsRail;
      }
    } else {
      markRailSuppressed(railEligibility, "FROM_YOUR_FOLLOWS", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "FROM_YOUR_FOLLOWS", "NO_SEEDS");
  }

  if (followExpandedTopicIds.length > 0) {
    const directFollowSet = new Set(followTopicIds);
    let relatedCandidates = await getQuizCandidatesByTopicIds(userId, followExpandedTopicIds, 28);
    relatedCandidates = relatedCandidates.filter((quiz) =>
      !quiz.topicConfigs.some((config) => directFollowSet.has(config.topic.id))
    );
    relatedCandidates = rankCandidatesWithPlayStyleBoost(relatedCandidates, playStyleProfile);

    if (relatedCandidates.length > 0) {
      const relatedItems = buildSeedAttributedItems({
        candidates: relatedCandidates,
        sourceKind: "RELATED_FOLLOWS",
        reasonPrefix: "Related to your follows",
        seedByExpandedTopicId: followAttribution.seedByExpandedTopicId,
      });
      const relatedRail = finalizeRail(
        "RELATED_TO_YOUR_FOLLOWS",
        "Related to Your Follows",
        relatedItems,
        dedupeSet
      );
      if (!relatedRail || relatedRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "RELATED_TO_YOUR_FOLLOWS", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "RELATED_TO_YOUR_FOLLOWS");
        railsByKind.RELATED_TO_YOUR_FOLLOWS = relatedRail;
      }
    } else {
      markRailSuppressed(railEligibility, "RELATED_TO_YOUR_FOLLOWS", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "RELATED_TO_YOUR_FOLLOWS", "NO_SEEDS");
  }

  if (teamExpandedTopicIds.length > 0) {
    let teamCandidates = await getQuizCandidatesByTopicIds(userId, teamExpandedTopicIds, 28);
    teamCandidates = rankCandidatesWithPlayStyleBoost(teamCandidates, playStyleProfile);
    if (teamCandidates.length > 0) {
      const teamItems = buildSeedAttributedItems({
        candidates: teamCandidates,
        sourceKind: "FAVORITE_TEAMS",
        reasonPrefix: "From teams you follow",
        seedByExpandedTopicId: teamAttribution.seedByExpandedTopicId,
      });
      const teamRail = finalizeRail(
        "FROM_YOUR_FAVORITE_TEAMS",
        "From Your Favorite Teams",
        teamItems,
        dedupeSet
      );
      if (!teamRail || teamRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_TEAMS", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "FROM_YOUR_FAVORITE_TEAMS");
        railsByKind.FROM_YOUR_FAVORITE_TEAMS = teamRail;
      }
    } else {
      markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_TEAMS", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_TEAMS", "NO_SEEDS");
  }

  if (athleteExpandedTopicIds.length > 0) {
    let athleteCandidates = await getQuizCandidatesByTopicIds(userId, athleteExpandedTopicIds, 28);
    athleteCandidates = rankCandidatesWithPlayStyleBoost(athleteCandidates, playStyleProfile);
    if (athleteCandidates.length > 0) {
      const athleteItems = buildSeedAttributedItems({
        candidates: athleteCandidates,
        sourceKind: "FAVORITE_ATHLETES",
        reasonPrefix: "From athletes you follow",
        seedByExpandedTopicId: athleteAttribution.seedByExpandedTopicId,
      });
      const athleteRail = finalizeRail(
        "FROM_YOUR_FAVORITE_ATHLETES",
        "From Your Favorite Athletes",
        athleteItems,
        dedupeSet
      );
      if (!athleteRail || athleteRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_ATHLETES", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "FROM_YOUR_FAVORITE_ATHLETES");
        railsByKind.FROM_YOUR_FAVORITE_ATHLETES = athleteRail;
      }
    } else {
      markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_ATHLETES", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "FROM_YOUR_FAVORITE_ATHLETES", "NO_SEEDS");
  }

  if (topSports.length > 0) {
    const topSportRails: PersonalizedHomeRail[] = [];
    let hadTopSportCandidates = false;
    for (const sportName of topSports) {
      if (topSportRails.length >= MAX_TOP_SPORT_RAILS) break;
      let sportCandidates = await getQuizCandidatesBySports(userId, [sportName], 28);
      sportCandidates = rankCandidatesWithPlayStyleBoost(sportCandidates, playStyleProfile);
      if (sportCandidates.length === 0) {
        continue;
      }
      hadTopSportCandidates = true;
      const sportItems = sportCandidates
        .filter((quiz): quiz is QuizCandidate & { sport: string } => Boolean(quiz.sport))
        .map((quiz) => toQuizItem(quiz, `More from ${quiz.sport}`, "TOP_SPORTS"));
      const sportRail = finalizeRail(
        "MORE_FROM_YOUR_TOP_SPORTS",
        `More From ${sportName}`,
        sportItems,
        dedupeSet,
        undefined,
        `MORE_FROM_YOUR_TOP_SPORTS:${toRailIdSegment(sportName)}`
      );
      if (!sportRail || sportRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        continue;
      }
      topSportRails.push(sportRail);
    }
    if (topSportRails.length > 0) {
      markRailShown(railEligibility, "MORE_FROM_YOUR_TOP_SPORTS");
      multiRailsByKind.MORE_FROM_YOUR_TOP_SPORTS = topSportRails;
    } else {
      markRailSuppressed(
        railEligibility,
        "MORE_FROM_YOUR_TOP_SPORTS",
        hadTopSportCandidates ? "DEDUPED_BELOW_THRESHOLD" : "NO_CANDIDATES"
      );
    }
  } else {
    markRailSuppressed(railEligibility, "MORE_FROM_YOUR_TOP_SPORTS", "NO_SEEDS");
  }

  if (effectiveExpandedTopicIds.length > 0) {
    let freshCandidates = await getQuizCandidatesByTopicIds(userId, effectiveExpandedTopicIds, 28);
    freshCandidates = rankCandidatesWithPlayStyleBoost(freshCandidates, playStyleProfile);
    if (freshCandidates.length > 0) {
      const freshItems = freshCandidates.map((quiz) =>
        toQuizItem(quiz, "New in your interests", "NEW_IN_GRAPH")
      );
      const freshRail = finalizeRail("NEW_IN_YOUR_GRAPH", "New in Your Graph", freshItems, dedupeSet);
      if (!freshRail || freshRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "NEW_IN_YOUR_GRAPH", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "NEW_IN_YOUR_GRAPH");
        railsByKind.NEW_IN_YOUR_GRAPH = freshRail;
      }
    } else {
      markRailSuppressed(railEligibility, "NEW_IN_YOUR_GRAPH", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "NEW_IN_YOUR_GRAPH", "NO_SEEDS");
  }

  if (topSportExpandedTopicIds.length > 0 && topSports.length > 0) {
    const attemptedTopicIds = await getAttemptedTopicIds(userId);
    let unexploredCandidates = await getQuizCandidatesByTopicIds(userId, topSportExpandedTopicIds, 36);
    unexploredCandidates = unexploredCandidates.filter(
      (quiz) => !quiz.topicConfigs.some((config) => attemptedTopicIds.has(config.topic.id))
    );
    unexploredCandidates = rankCandidatesWithPlayStyleBoost(unexploredCandidates, playStyleProfile);
    if (unexploredCandidates.length > 0) {
      const unexploredItems = unexploredCandidates.map((quiz) => {
        const sportLabel = quiz.sport ?? topSports[0] ?? "your sports";
        return toQuizItem(quiz, `Unexplored in ${sportLabel}`, "UNEXPLORED_SPORTS");
      });
      const unexploredRail = finalizeRail(
        "UNEXPLORED_IN_YOUR_SPORTS",
        "Unexplored in Your Sports",
        unexploredItems,
        dedupeSet
      );
      if (!unexploredRail || unexploredRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "UNEXPLORED_IN_YOUR_SPORTS", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "UNEXPLORED_IN_YOUR_SPORTS");
        railsByKind.UNEXPLORED_IN_YOUR_SPORTS = unexploredRail;
      }
    } else {
      markRailSuppressed(railEligibility, "UNEXPLORED_IN_YOUR_SPORTS", "NO_CANDIDATES");
    }
  } else {
    markRailSuppressed(railEligibility, "UNEXPLORED_IN_YOUR_SPORTS", "NO_SEEDS");
  }

  const hasPersonalizedRails = primaryPersonalizedKinds.some((kind) => Boolean(railsByKind[kind]));

  if (!hasPersonalizedRails && onboardingExpandedTopicIds.length > 0) {
    let onboardingCandidates = await getQuizCandidatesByTopicIds(userId, onboardingExpandedTopicIds, 28);
    onboardingCandidates = rankCandidatesWithPlayStyleBoost(onboardingCandidates, playStyleProfile);
    if (onboardingCandidates.length > 0) {
      const onboardingItems = onboardingCandidates.map((quiz) =>
        toQuizItem(quiz, "From your onboarding picks", "ONBOARDING_PICKS")
      );
      const onboardingRail = finalizeRail("ONBOARDING_PICKS", "From Your Onboarding Picks", onboardingItems, dedupeSet);
      if (!onboardingRail || onboardingRail.items.length < MIN_ITEMS_FOR_PERSONALIZED_RAIL) {
        markRailSuppressed(railEligibility, "ONBOARDING_PICKS", "DEDUPED_BELOW_THRESHOLD");
      } else {
        markRailShown(railEligibility, "ONBOARDING_PICKS");
        railsByKind.ONBOARDING_PICKS = onboardingRail;
      }
    } else {
      markRailSuppressed(railEligibility, "ONBOARDING_PICKS", "NO_CANDIDATES");
    }
  } else if (!hasPersonalizedRails) {
    markRailSuppressed(railEligibility, "ONBOARDING_PICKS", "NO_SEEDS");
  } else {
    markRailSuppressed(railEligibility, "ONBOARDING_PICKS", "NO_SEEDS");
  }

  const trending = await getTrendingCandidates(userId, topSports, {
    limit: 32,
    forcePlatform: !hasPersonalizedRails,
  });
  const rankedTrendingCandidates = rankCandidatesWithPlayStyleBoost(trending.candidates, playStyleProfile);
  const trendingPresentation = getTrendingRailPresentation(trending.trendScope);

  const trendingItems = rankedTrendingCandidates.map((quiz) => {
    const reasonLabel = trending.trendScope === "SPORT_SCOPED" && quiz.sport
      ? `Trending in ${quiz.sport}`
      : "Trending now";

    return toQuizItem(
      quiz,
      reasonLabel,
      trendingPresentation.sourceKind
    );
  });

  const trendingRail = finalizeRail(
    "TRENDING_IN_YOUR_SPORTS",
    trendingPresentation.title,
    trendingItems,
    dedupeSet,
    trending.trendScope
  );
  if (trendingRail) {
    markRailShown(railEligibility, "TRENDING_IN_YOUR_SPORTS");
    railsByKind.TRENDING_IN_YOUR_SPORTS = trendingRail;
  } else {
    markRailSuppressed(railEligibility, "TRENDING_IN_YOUR_SPORTS", "DEDUPED_BELOW_THRESHOLD");
  }

  const rails = buildRailOrder(railsByKind, multiRailsByKind, MAX_VISIBLE_RAILS);

  const starterCollections = !hasPersonalizedRails
    ? await getStarterCollections()
    : [];

  const diagnostics = buildPersonalizationDiagnostics({
    trendScope: trending.trendScope,
    hasPersonalizedRails,
    topSportsCount: topSports.length,
    scopedTrendingCandidateCount: trending.scopedCandidateCount,
    sportScopedAttempted: trending.sportScopedAttempted,
    forcePlatformFallback: trending.forcePlatformFallback,
    railEligibility,
    playStyleBoostEnabled,
    playStyleEvidenceCount: playStyleProfile?.evidenceCount ?? recentPlayStyleSignals.length,
  });

  if (isPersonalizedHomeDiagnosticsEnabled()) {
    console.info(
      "[personalized-home] diagnostics",
      JSON.stringify({
        userId,
        diagnostics,
      })
    );
  }

  return {
    generatedAt: now.toISOString(),
    userSummary: {
      userId: user.id,
      displayName: user.name ?? "Player",
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    continuePlaying,
    dailyChallenge,
    rails,
    starterCollections,
  };
}
