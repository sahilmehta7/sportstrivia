import type { TopicRelationTypeValue } from "@/lib/topic-graph/topic-readiness.service";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

const SUPPORTED_SPORT_ANCHOR_TYPES = new Set<TopicSchemaTypeValue>([
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

const SPORT_LIKE_TEAM_NAMES = new Set([
  "football",
  "volleyball",
  "handball",
  "kabaddi",
  "polo",
  "water polo",
  "beach volleyball",
  "billiards",
]);

export type TopicHierarchyNode = {
  id: string;
  name: string;
  slug: string;
  schemaType: TopicSchemaTypeValue;
  parentId: string | null;
  level: number;
  alternateNames: string[];
  description?: string | null;
};

export type InferredRelation = {
  fromTopicId: string;
  toTopicId: string;
  relationType: TopicRelationTypeValue;
  reason: string;
};

export type SkippedTopic = {
  topicId: string;
  reason: string;
};

export type AnomalyTopic = {
  topicId: string;
  anomalyCode: string;
  message: string;
};

export type TypedTopicAnalysisRow = {
  topicId: string;
  name: string;
  slug: string;
  currentSchemaType: TopicSchemaTypeValue;
  level: number;
  parentName: string;
  ancestorPath: string;
  nearestSportAncestorId: string | null;
  nearestSportAncestorName: string;
  nearestSportAncestorSlug: string;
  inferredRelations: InferredRelation[];
  anomalyCodes: string[];
};

export type UntypedTopicAnalysisRow = {
  topicId: string;
  name: string;
  slug: string;
  level: number;
  parentName: string;
  ancestorPath: string;
  nearestTypedAncestorName: string;
  nearestTypedAncestorType: TopicSchemaTypeValue | "";
  suggestedAction: string;
};

export type TopicInferenceAnalysis = {
  inferredRelations: InferredRelation[];
  skippedTopics: SkippedTopic[];
  anomalyTopics: AnomalyTopic[];
  typedTopics: TypedTopicAnalysisRow[];
  untypedTopics: UntypedTopicAnalysisRow[];
};

function buildAncestorChain(topic: TopicHierarchyNode, byId: Map<string, TopicHierarchyNode>): TopicHierarchyNode[] {
  const chain: TopicHierarchyNode[] = [];
  let currentParentId = topic.parentId;

  while (currentParentId) {
    const parent = byId.get(currentParentId);
    if (!parent) break;
    chain.unshift(parent);
    currentParentId = parent.parentId;
  }

  return chain;
}

function findNearestSportAncestor(topic: TopicHierarchyNode, byId: Map<string, TopicHierarchyNode>) {
  let currentParentId = topic.parentId;
  while (currentParentId) {
    const parent = byId.get(currentParentId);
    if (!parent) break;
    if (parent.schemaType === "SPORT") {
      return parent;
    }
    currentParentId = parent.parentId;
  }
  return null;
}

function findNearestTypedAncestor(topic: TopicHierarchyNode, byId: Map<string, TopicHierarchyNode>) {
  let currentParentId = topic.parentId;
  while (currentParentId) {
    const parent = byId.get(currentParentId);
    if (!parent) break;
    if (parent.schemaType !== "NONE") {
      return parent;
    }
    currentParentId = parent.parentId;
  }
  return null;
}

function getParentName(topic: TopicHierarchyNode, byId: Map<string, TopicHierarchyNode>): string {
  if (!topic.parentId) return "";
  return byId.get(topic.parentId)?.name ?? "";
}

function getAncestorPath(topic: TopicHierarchyNode, byId: Map<string, TopicHierarchyNode>): string {
  return buildAncestorChain(topic, byId)
    .map((ancestor) => ancestor.name)
    .join(" > ");
}

function detectAnomalies(topic: TopicHierarchyNode): AnomalyTopic[] {
  const normalizedName = topic.name.trim().toLowerCase();
  if (
    topic.schemaType === "SPORTS_TEAM" &&
    topic.level <= 1 &&
    SPORT_LIKE_TEAM_NAMES.has(normalizedName)
  ) {
    return [
      {
        topicId: topic.id,
        anomalyCode: "LIKELY_SPORT_MISCLASSIFIED_AS_TEAM",
        message: `${topic.name} looks like a sport/category, not a sports team`,
      },
    ];
  }

  return [];
}

export function analyzeTopicHierarchy(topics: TopicHierarchyNode[]): TopicInferenceAnalysis {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const inferredRelations: InferredRelation[] = [];
  const skippedTopics: SkippedTopic[] = [];
  const anomalyTopics: AnomalyTopic[] = [];
  const typedTopics: TypedTopicAnalysisRow[] = [];
  const untypedTopics: UntypedTopicAnalysisRow[] = [];

  for (const topic of topics) {
    const ancestorPath = getAncestorPath(topic, byId);
    const parentName = getParentName(topic, byId);

    if (topic.schemaType === "NONE") {
      const nearestTypedAncestor = findNearestTypedAncestor(topic, byId);
      untypedTopics.push({
        topicId: topic.id,
        name: topic.name,
        slug: topic.slug,
        level: topic.level,
        parentName,
        ancestorPath,
        nearestTypedAncestorName: nearestTypedAncestor?.name ?? "",
        nearestTypedAncestorType: nearestTypedAncestor?.schemaType ?? "",
        suggestedAction: "review_schema_type",
      });
      continue;
    }

    const detected = detectAnomalies(topic);
    anomalyTopics.push(...detected);

    const nearestSportAncestor = findNearestSportAncestor(topic, byId);
    const topicInferredRelations: InferredRelation[] = [];

    if (SUPPORTED_SPORT_ANCHOR_TYPES.has(topic.schemaType)) {
      if (nearestSportAncestor) {
        const relation: InferredRelation = {
          fromTopicId: topic.id,
          toTopicId: nearestSportAncestor.id,
          relationType: "BELONGS_TO_SPORT",
          reason: "nearest_sport_ancestor",
        };
        inferredRelations.push(relation);
        topicInferredRelations.push(relation);
      } else {
        skippedTopics.push({
          topicId: topic.id,
          reason: "missing_sport_ancestor",
        });
      }
    }

    typedTopics.push({
      topicId: topic.id,
      name: topic.name,
      slug: topic.slug,
      currentSchemaType: topic.schemaType,
      level: topic.level,
      parentName,
      ancestorPath,
      nearestSportAncestorId: nearestSportAncestor?.id ?? null,
      nearestSportAncestorName: nearestSportAncestor?.name ?? "",
      nearestSportAncestorSlug: nearestSportAncestor?.slug ?? "",
      inferredRelations: topicInferredRelations,
      anomalyCodes: detected.map((entry) => entry.anomalyCode),
    });
  }

  return {
    inferredRelations,
    skippedTopics,
    anomalyTopics,
    typedTopics,
    untypedTopics,
  };
}

export function buildTypedTopicReportRows(analysis: TopicInferenceAnalysis) {
  return analysis.typedTopics.map((row) => ({
    topicId: row.topicId,
    name: row.name,
    slug: row.slug,
    currentSchemaType: row.currentSchemaType,
    level: row.level,
    parentName: row.parentName,
    ancestorPath: row.ancestorPath,
    nearestSportAncestorName: row.nearestSportAncestorName,
    nearestSportAncestorSlug: row.nearestSportAncestorSlug,
    inferredRelationTargetSlug: row.inferredRelations[0]?.toTopicId === row.nearestSportAncestorId ? row.nearestSportAncestorSlug : "",
    anomalyCodes: row.anomalyCodes.join("|"),
  }));
}

export function buildUntypedTopicReportRows(analysis: TopicInferenceAnalysis) {
  return analysis.untypedTopics.map((row) => ({
    topicId: row.topicId,
    name: row.name,
    slug: row.slug,
    level: row.level,
    parentName: row.parentName,
    ancestorPath: row.ancestorPath,
    nearestTypedAncestorName: row.nearestTypedAncestorName,
    nearestTypedAncestorType: row.nearestTypedAncestorType,
    suggestedAction: row.suggestedAction,
  }));
}
