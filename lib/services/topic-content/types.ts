export const TOPIC_CONTENT_STAGES = [
  "COLLECT",
  "NORMALIZE",
  "VERIFY",
  "GENERATE",
  "SCORE",
  "PUBLISH",
] as const;

export const TOPIC_CONTENT_RUN_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"] as const;
export const TOPIC_CONTENT_SNAPSHOT_STATUSES = ["DRAFT", "READY", "PUBLISHED", "REJECTED"] as const;
export const TOPIC_CONTENT_TOPIC_STATUSES = ["NONE", "DRAFT", "READY", "PUBLISHED"] as const;

export type TopicContentStage = (typeof TOPIC_CONTENT_STAGES)[number];
export type TopicContentRunStatus = (typeof TOPIC_CONTENT_RUN_STATUSES)[number];
export type TopicContentSnapshotStatus = (typeof TOPIC_CONTENT_SNAPSHOT_STATUSES)[number];
export type TopicContentTopicStatus = (typeof TOPIC_CONTENT_TOPIC_STATUSES)[number];

export type TopicClaimType = "FACT" | "TIMELINE" | "ENTITY_RELATION" | "STAT";

export type ContentQualityGate = {
  minWordCount: number;
  minSelectedClaims: number;
  minDistinctSources: number;
  minCitationCoverage: number;
  minQualityScore: number;
};

export const DEFAULT_QUALITY_GATE: ContentQualityGate = {
  // Trivia-style output gate (not long-form SEO article gate).
  minWordCount: 120,
  minSelectedClaims: 8,
  minDistinctSources: 2,
  minCitationCoverage: 0.25,
  minQualityScore: 58,
};
