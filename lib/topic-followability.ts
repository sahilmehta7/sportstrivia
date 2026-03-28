import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export const FOLLOWABLE_SCHEMA_TYPES = new Set<TopicSchemaTypeValue>([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

export function isFollowableTopicSchemaType(schemaType: TopicSchemaTypeValue): boolean {
  return FOLLOWABLE_SCHEMA_TYPES.has(schemaType);
}
