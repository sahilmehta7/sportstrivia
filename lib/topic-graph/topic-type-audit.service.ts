import { TOPIC_SCHEMA_TYPES, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export type TopicTypeAuditPromptInput = {
  topicName: string;
  topicSlug: string;
  currentSchemaType: TopicSchemaTypeValue;
  description: string;
  alternateNames: string[];
  ancestorPath: string;
  childSummaries: string[];
  nearestSportAncestorName: string;
};

export function buildTopicTypeAuditPromptInput(input: {
  topic: {
    id: string;
    name: string;
    slug: string;
    schemaType: TopicSchemaTypeValue;
    description: string | null;
    alternateNames: string[];
  };
  ancestors: Array<{ name: string; schemaType: TopicSchemaTypeValue }>;
  children: Array<{ name: string; schemaType: TopicSchemaTypeValue }>;
  inferenceHints: { nearestSportAncestorName?: string };
}): TopicTypeAuditPromptInput {
  return {
    topicName: input.topic.name,
    topicSlug: input.topic.slug,
    currentSchemaType: input.topic.schemaType,
    description: input.topic.description ?? "",
    alternateNames: input.topic.alternateNames,
    ancestorPath: input.ancestors.map((ancestor) => ancestor.name).join(" > "),
    childSummaries: input.children.map((child) => `${child.name} (${child.schemaType})`),
    nearestSportAncestorName: input.inferenceHints.nearestSportAncestorName ?? "",
  };
}

export function normalizeTopicTypeAuditResult(input: unknown): {
  suggestedSchemaType: TopicSchemaTypeValue | null;
  confidence: number | null;
  rationale: string;
} {
  if (
    typeof input === "object" &&
    input !== null &&
    "suggestedSchemaType" in input &&
    "confidence" in input &&
    "rationale" in input
  ) {
    const suggestedSchemaType = (input as any).suggestedSchemaType;
    const confidence = (input as any).confidence;
    const rationale = (input as any).rationale;

    if (
      TOPIC_SCHEMA_TYPES.includes(suggestedSchemaType) &&
      typeof confidence === "number" &&
      Number.isFinite(confidence) &&
      typeof rationale === "string" &&
      rationale.trim()
    ) {
      return {
        suggestedSchemaType,
        confidence,
        rationale,
      };
    }
  }

  return {
    suggestedSchemaType: null,
    confidence: null,
    rationale: "Invalid AI classification payload",
  };
}
