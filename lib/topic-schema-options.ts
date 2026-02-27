export const TOPIC_SCHEMA_TYPES = [
  "NONE",
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_ORGANIZATION",
  "SPORTS_EVENT",
] as const;

export type TopicSchemaTypeValue = (typeof TOPIC_SCHEMA_TYPES)[number];

export const TOPIC_SCHEMA_TYPE_LABELS: Record<TopicSchemaTypeValue, string> = {
  NONE: "None",
  SPORT: "Sport (DefinedTerm)",
  SPORTS_TEAM: "Sports Team",
  ATHLETE: "Athlete",
  SPORTS_ORGANIZATION: "Sports Organization",
  SPORTS_EVENT: "Sports Event",
};

