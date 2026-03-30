import "server-only";
import { prisma } from "@/lib/db";
import { SearchContext } from "@prisma/client";
import type { Difficulty, PlayMode } from "@prisma/client";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";

const INTEREST_PROFILE_TTL_MS = 10 * 60 * 1000;

type InterestTopic = {
  topicId: string;
  slug: string;
  name: string;
  schemaType: TopicSchemaTypeValue;
};

type ExplicitInterest = InterestTopic & {
  source: string;
  strength: number;
};

type FollowedTopic = InterestTopic;

type TopicStatSignal = InterestTopic & {
  questionsAnswered: number;
  successRate: number;
  lastAnsweredAt?: string | null;
};

type SearchSignal = InterestTopic & {
  timesSearched: number;
  lastSearchedAt?: string | null;
};

type DiscoveryPreferences = {
  preferredDifficulty: Difficulty | null;
  preferredPlayModes: PlayMode[];
};

type InterestProfileInput = {
  userId: string;
  explicitInterests: ExplicitInterest[];
  follows: FollowedTopic[];
  topicStats: TopicStatSignal[];
  searchSignals: SearchSignal[];
  preferences: DiscoveryPreferences;
};

type ScoredInterestTopic = InterestTopic & {
  score: number;
};

type ScoredExplicitInterestTopic = ScoredInterestTopic & {
  source: string;
};

export type InterestProfile = {
  contractVersion: "interest-profile/v1";
  userId: string;
  generatedAt: string;
  follows: ScoredInterestTopic[];
  explicit: ScoredExplicitInterestTopic[];
  inferred: ScoredInterestTopic[];
  preferences: DiscoveryPreferences;
  summary: {
    topEntities: string[];
    topSports: string[];
    preferredDifficulty: Difficulty | null;
    preferredPlayModes: PlayMode[];
  };
};

type CachedInterestProfile = {
  profile: InterestProfile;
  expiresAt: number;
};

const profileCache = new Map<string, CachedInterestProfile>();

function uniqueByTopicId<T extends InterestTopic>(items: T[]): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const item of items) {
    if (seen.has(item.topicId)) continue;
    seen.add(item.topicId);
    next.push(item);
  }
  return next;
}

function scoreAndSort<T extends { score: number; name: string }>(topics: T[]): T[] {
  return topics.sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

function rankInferredSignals(input: { topicStats: TopicStatSignal[]; searchSignals: SearchSignal[] }) {
  const mergedByTopic = new Map<string, ScoredInterestTopic>();

  for (const topic of input.topicStats) {
    if (!isFollowableTopicSchemaType(topic.schemaType)) continue;

    const score = Math.round(
      Math.min(30, topic.questionsAnswered * 0.75) +
        Math.max(0, Math.min(20, topic.successRate * 0.15))
    );

    const previous = mergedByTopic.get(topic.topicId);
    if (!previous || previous.score < score) {
      mergedByTopic.set(topic.topicId, {
        topicId: topic.topicId,
        slug: topic.slug,
        name: topic.name,
        schemaType: topic.schemaType,
        score,
      });
    }
  }

  for (const topic of input.searchSignals) {
    if (!isFollowableTopicSchemaType(topic.schemaType)) continue;

    const score = Math.min(20, topic.timesSearched * 2);
    const previous = mergedByTopic.get(topic.topicId);
    if (previous) {
      previous.score += score;
      continue;
    }

    mergedByTopic.set(topic.topicId, {
      topicId: topic.topicId,
      slug: topic.slug,
      name: topic.name,
      schemaType: topic.schemaType,
      score,
    });
  }

  return scoreAndSort(Array.from(mergedByTopic.values())).slice(0, 20);
}

export function invalidateInterestProfileCache(userId: string) {
  profileCache.delete(userId);
}

export function clearInterestProfileCache() {
  profileCache.clear();
}

export function computeInterestProfile(input: InterestProfileInput): InterestProfile {
  const follows = scoreAndSort(
    uniqueByTopicId(
      input.follows
        .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
        .map((topic) => ({
          ...topic,
          score: 100,
        }))
    )
  );

  const explicit = scoreAndSort(
    uniqueByTopicId(
      input.explicitInterests
        .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
        .map((topic) => ({
          topicId: topic.topicId,
          slug: topic.slug,
          name: topic.name,
          schemaType: topic.schemaType,
          source: topic.source,
          score: 60 + topic.strength * 10,
        }))
    )
  );

  const inferred = rankInferredSignals({
    topicStats: input.topicStats,
    searchSignals: input.searchSignals,
  });

  const topEntities = scoreAndSort([...follows, ...explicit, ...inferred])
    .slice(0, 5)
    .map((topic) => topic.name);

  const topSports = scoreAndSort([...follows, ...explicit, ...inferred])
    .filter((topic) => topic.schemaType === "SPORT")
    .slice(0, 3)
    .map((topic) => topic.name);

  return {
    contractVersion: "interest-profile/v1",
    userId: input.userId,
    generatedAt: new Date().toISOString(),
    follows,
    explicit,
    inferred,
    preferences: input.preferences,
    summary: {
      topEntities,
      topSports,
      preferredDifficulty: input.preferences.preferredDifficulty,
      preferredPlayModes: input.preferences.preferredPlayModes,
    },
  };
}

function normalizeInterestProfileContract(profile: InterestProfile): InterestProfile {
  return {
    contractVersion: "interest-profile/v1",
    userId: profile.userId,
    generatedAt: profile.generatedAt,
    follows: (profile.follows ?? []).map((entry) => ({
      topicId: entry.topicId,
      slug: entry.slug,
      name: entry.name,
      schemaType: entry.schemaType,
      score: Number.isFinite(entry.score) ? entry.score : 0,
    })),
    explicit: (profile.explicit ?? []).map((entry) => ({
      topicId: entry.topicId,
      slug: entry.slug,
      name: entry.name,
      schemaType: entry.schemaType,
      source: entry.source ?? "PROFILE",
      score: Number.isFinite(entry.score) ? entry.score : 0,
    })),
    inferred: (profile.inferred ?? []).map((entry) => ({
      topicId: entry.topicId,
      slug: entry.slug,
      name: entry.name,
      schemaType: entry.schemaType,
      score: Number.isFinite(entry.score) ? entry.score : 0,
    })),
    preferences: {
      preferredDifficulty: profile.preferences?.preferredDifficulty ?? null,
      preferredPlayModes: profile.preferences?.preferredPlayModes ?? [],
    },
    summary: {
      topEntities: profile.summary?.topEntities ?? [],
      topSports: profile.summary?.topSports ?? [],
      preferredDifficulty:
        profile.summary?.preferredDifficulty ??
        profile.preferences?.preferredDifficulty ??
        null,
      preferredPlayModes:
        profile.summary?.preferredPlayModes ??
        profile.preferences?.preferredPlayModes ??
        [],
    },
  };
}

async function mapSearchQueriesToTopics(
  entries: Array<{
    timesSearched: number;
    lastSearchedAt: Date;
    searchQuery: {
      query: string;
      context: SearchContext;
    };
  }>
): Promise<SearchSignal[]> {
  const queryEntries = entries
    .map((entry) => ({
      ...entry,
      rawQuery: entry.searchQuery.query.trim(),
    }))
    .filter((entry) => entry.rawQuery.length > 0);

  if (queryEntries.length === 0) {
    return [];
  }

  const rawQueries = Array.from(new Set(queryEntries.map((entry) => entry.rawQuery)));
  const normalizedQueries = Array.from(new Set(rawQueries.map((query) => query.toLowerCase())));

  const exactCandidates = await prisma.topic.findMany({
    where: {
      OR: [
        ...normalizedQueries.map((query) => ({
          slug: { equals: query, mode: "insensitive" as const },
        })),
        ...rawQueries.map((query) => ({
          name: { equals: query, mode: "insensitive" as const },
        })),
        {
          alternateNames: {
            hasSome: [...rawQueries, ...normalizedQueries],
          },
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      schemaType: true,
      alternateNames: true,
      indexEligible: true,
      updatedAt: true,
    },
    orderBy: [{ indexEligible: "desc" }, { updatedAt: "desc" }],
  });

  const exactMatchMap = new Map<
    string,
    {
      id: string;
      slug: string;
      name: string;
      schemaType: TopicSchemaTypeValue;
    }
  >();

  for (const topic of exactCandidates) {
    if (!topic.slug || !topic.name || !topic.schemaType) continue;
    const keys = [
      topic.slug.toLowerCase(),
      topic.name.toLowerCase(),
      ...(topic.alternateNames ?? []).map((value) => value.toLowerCase()),
    ];
    for (const key of keys) {
      if (!exactMatchMap.has(key)) {
        exactMatchMap.set(key, {
          id: topic.id,
          slug: topic.slug,
          name: topic.name,
          schemaType: topic.schemaType,
        });
      }
    }
  }

  const unmatchedHighConfidence = Array.from(
    new Set(
      queryEntries
        .map((entry) => entry.rawQuery.toLowerCase())
        .filter((query) => {
          if (query.length < 4) return false;
          if (query.includes(" ")) return false;
          return !exactMatchMap.has(query);
        })
    )
  );

  const prefixMatchMap = new Map<
    string,
    {
      id: string;
      slug: string;
      name: string;
      schemaType: TopicSchemaTypeValue;
    }
  >();

  if (unmatchedHighConfidence.length > 0) {
    const prefixCandidates = await prisma.topic.findMany({
      where: {
        indexEligible: true,
        OR: unmatchedHighConfidence.map((query) => ({
          OR: [
            { slug: { startsWith: query, mode: "insensitive" as const } },
            { name: { startsWith: query, mode: "insensitive" as const } },
          ],
        })),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        schemaType: true,
      },
      orderBy: [{ indexEligible: "desc" }, { updatedAt: "desc" }],
    });

    for (const query of unmatchedHighConfidence) {
      const match = prefixCandidates.find((topic) => {
        const normalizedSlug = (topic.slug ?? "").toLowerCase();
        const normalizedName = (topic.name ?? "").toLowerCase();
        return normalizedSlug.startsWith(query) || normalizedName.startsWith(query);
      });
      if (match) {
        prefixMatchMap.set(query, match);
      }
    }
  }

  const signals: SearchSignal[] = [];

  for (const entry of queryEntries) {
    const normalized = entry.rawQuery.toLowerCase();
    const topic = exactMatchMap.get(normalized) ?? prefixMatchMap.get(normalized);
    if (!topic || !isFollowableTopicSchemaType(topic.schemaType)) continue;

    signals.push({
      topicId: topic.id,
      slug: topic.slug,
      name: topic.name,
      schemaType: topic.schemaType,
      timesSearched: entry.timesSearched,
      lastSearchedAt: entry.lastSearchedAt.toISOString(),
    });
  }

  return signals;
}

export async function getInterestProfileForUser(
  userId: string,
  options: { bypassCache?: boolean } = {}
): Promise<InterestProfile> {
  const cached = profileCache.get(userId);
  if (!options.bypassCache && cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  const [explicitInterests, follows, topicStats, userSearchEntries, preferences] = await Promise.all([
    prisma.userInterestPreference.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            name: true,
            schemaType: true,
          },
        },
      },
    }),
    prisma.userFollowedTopic.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            name: true,
            schemaType: true,
          },
        },
      },
    }),
    prisma.userTopicStats.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            name: true,
            schemaType: true,
          },
        },
      },
      orderBy: { lastAnsweredAt: "desc" },
      take: 30,
    }),
    prisma.userSearchQuery.findMany({
      where: { userId },
      include: {
        searchQuery: {
          select: {
            query: true,
            context: true,
          },
        },
      },
      orderBy: { lastSearchedAt: "desc" },
      take: 30,
    }),
    prisma.userDiscoveryPreference.findUnique({
      where: { userId },
    }),
  ]);

  const searchSignals = await mapSearchQueriesToTopics(
    userSearchEntries.filter((entry) => entry.searchQuery.context === SearchContext.TOPIC)
  );

  const computedProfile = computeInterestProfile({
    userId,
    explicitInterests: explicitInterests.map((entry) => ({
      topicId: entry.topic.id,
      slug: entry.topic.slug,
      name: entry.topic.name,
      schemaType: entry.topic.schemaType,
      source: entry.source,
      strength: entry.strength,
    })),
    follows: follows.map((entry) => ({
      topicId: entry.topic.id,
      slug: entry.topic.slug,
      name: entry.topic.name,
      schemaType: entry.topic.schemaType,
    })),
    topicStats: topicStats.map((entry) => ({
      topicId: entry.topic.id,
      slug: entry.topic.slug,
      name: entry.topic.name,
      schemaType: entry.topic.schemaType,
      questionsAnswered: entry.questionsAnswered,
      successRate: entry.successRate,
      lastAnsweredAt: entry.lastAnsweredAt?.toISOString() ?? null,
    })),
    searchSignals,
    preferences: {
      preferredDifficulty: preferences?.preferredDifficulty ?? null,
      preferredPlayModes: preferences?.preferredPlayModes ?? [],
    },
  });

  const profile = normalizeInterestProfileContract(computedProfile);

  profileCache.set(userId, {
    profile,
    expiresAt: Date.now() + INTEREST_PROFILE_TTL_MS,
  });

  return profile;
}
