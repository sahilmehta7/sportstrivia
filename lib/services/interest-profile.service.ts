import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

const FOLLOWABLE_SCHEMA_TYPES = new Set<TopicSchemaTypeValue>([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

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
  preferredDifficulty: string | null;
  preferredPlayModes: string[];
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

type InterestProfile = {
  userId: string;
  follows: ScoredInterestTopic[];
  explicit: ScoredInterestTopic[];
  inferred: ScoredInterestTopic[];
  preferences: DiscoveryPreferences;
  summary: {
    topEntities: string[];
  };
};

export function isFollowableTopicSchemaType(schemaType: TopicSchemaTypeValue): boolean {
  return FOLLOWABLE_SCHEMA_TYPES.has(schemaType);
}

export function computeInterestProfile(input: InterestProfileInput): InterestProfile {
  const follows = input.follows
    .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
    .map((topic) => ({
      ...topic,
      score: 100,
    }));

  const explicit = input.explicitInterests
    .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
    .map((topic) => ({
      topicId: topic.topicId,
      slug: topic.slug,
      name: topic.name,
      schemaType: topic.schemaType,
      score: 60 + topic.strength * 10,
    }));

  const inferredFromStats = input.topicStats
    .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
    .map((topic) => ({
      topicId: topic.topicId,
      slug: topic.slug,
      name: topic.name,
      schemaType: topic.schemaType,
      score: Math.round(topic.questionsAnswered * 2 + topic.successRate / 2),
    }));

  const inferredFromSearch = input.searchSignals
    .filter((topic) => isFollowableTopicSchemaType(topic.schemaType))
    .map((topic) => ({
      topicId: topic.topicId,
      slug: topic.slug,
      name: topic.name,
      schemaType: topic.schemaType,
      score: topic.timesSearched * 5,
    }));

  const inferred = [...inferredFromStats, ...inferredFromSearch]
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 20);

  const topEntities = [...follows, ...explicit, ...inferred]
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 5)
    .map((topic) => topic.name);

  return {
    userId: input.userId,
    follows,
    explicit,
    inferred,
    preferences: input.preferences,
    summary: {
      topEntities,
    },
  };
}
