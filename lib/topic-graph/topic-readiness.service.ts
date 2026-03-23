import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export type TopicRelationTypeValue =
  | "BELONGS_TO_SPORT"
  | "PLAYS_FOR"
  | "REPRESENTS"
  | "COMPETES_IN"
  | "ORGANIZED_BY"
  | "RIVAL_OF"
  | "RELATED_TO";

export type TopicEntityStatusValue = "DRAFT" | "READY" | "NEEDS_REVIEW";

class TopicRelationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicRelationValidationError";
  }
}

type RelationValidationInput = {
  fromTopicId: string;
  toTopicId: string;
  fromSchemaType: TopicSchemaTypeValue;
  toSchemaType: TopicSchemaTypeValue;
  relationType: TopicRelationTypeValue;
};

type ReadinessRelation = {
  fromTopicId: string;
  toTopicId: string;
  relationType: TopicRelationTypeValue;
};

type ReadinessInput = {
  schemaType: TopicSchemaTypeValue;
  schemaCanonicalUrl?: string | null;
  schemaEntityData?: Record<string, unknown> | null;
  relations: ReadinessRelation[];
};

type ReadinessResult = {
  isReady: boolean;
  entityStatus: TopicEntityStatusValue;
  errors: string[];
};

const allowedRelationPairs = new Set<string>([
  "SPORTS_TEAM:BELONGS_TO_SPORT:SPORT",
  "ATHLETE:BELONGS_TO_SPORT:SPORT",
  "SPORTS_EVENT:BELONGS_TO_SPORT:SPORT",
  "SPORTS_ORGANIZATION:BELONGS_TO_SPORT:SPORT",
  "ATHLETE:PLAYS_FOR:SPORTS_TEAM",
  "ATHLETE:REPRESENTS:SPORTS_TEAM",
  "SPORTS_TEAM:COMPETES_IN:SPORTS_EVENT",
  "SPORTS_EVENT:ORGANIZED_BY:SPORTS_ORGANIZATION",
  "SPORTS_TEAM:RIVAL_OF:SPORTS_TEAM",
]);

export function isAllowedTopicRelationPair(
  fromSchemaType: TopicSchemaTypeValue,
  relationType: TopicRelationTypeValue,
  toSchemaType: TopicSchemaTypeValue
): boolean {
  if (fromSchemaType === "NONE" || toSchemaType === "NONE") {
    return false;
  }

  if (relationType === "RELATED_TO") {
    return true;
  }

  return allowedRelationPairs.has(`${fromSchemaType}:${relationType}:${toSchemaType}`);
}

export function normalizeAlternateNames(
  canonicalName: string,
  alternateNames: string[] | null | undefined
): string[] {
  if (!Array.isArray(alternateNames)) return [];

  const canonical = canonicalName.trim().toLocaleLowerCase();
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of alternateNames) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const folded = trimmed.toLocaleLowerCase();
    if (folded === canonical || seen.has(folded)) continue;

    seen.add(folded);
    normalized.push(trimmed);
  }

  return normalized;
}

export function validateTopicRelation(input: RelationValidationInput): true {
  if (input.fromTopicId === input.toTopicId) {
    throw new TopicRelationValidationError("A topic cannot be related to itself");
  }

  if (input.fromSchemaType === "NONE" || input.toSchemaType === "NONE") {
    throw new TopicRelationValidationError("Typed relations require typed topics");
  }

  if (input.relationType === "RELATED_TO") {
    return true;
  }

  if (!isAllowedTopicRelationPair(input.fromSchemaType, input.relationType, input.toSchemaType)) {
    throw new TopicRelationValidationError("Invalid relation pairing");
  }

  return true;
}

export function evaluateTopicEntityReadiness(input: ReadinessInput): ReadinessResult {
  if (input.schemaType === "NONE") {
    return {
      isReady: false,
      entityStatus: "DRAFT",
      errors: ["Typed entity readiness is not available for schemaType NONE"],
    };
  }

  const errors: string[] = [];

  if (!input.schemaCanonicalUrl?.trim()) {
    errors.push("schemaCanonicalUrl is required");
  }

  if (!input.schemaEntityData || Object.keys(input.schemaEntityData).length === 0) {
    errors.push("schemaEntityData is required");
  }

  if (input.schemaType !== "SPORT") {
    const sportAnchors = input.relations.filter(
      (relation) => relation.relationType === "BELONGS_TO_SPORT"
    );

    if (sportAnchors.length !== 1) {
      errors.push("Non-sport entities must have exactly one BELONGS_TO_SPORT relation");
    }
  }

  return {
    isReady: errors.length === 0,
    entityStatus: errors.length === 0 ? "READY" : "NEEDS_REVIEW",
    errors,
  };
}
