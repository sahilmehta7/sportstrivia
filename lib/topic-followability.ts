import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export type FollowableTopicSchemaType = Exclude<TopicSchemaTypeValue, "NONE">;

export const FOLLOWABLE_SCHEMA_TYPES = new Set<FollowableTopicSchemaType>([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

export function isFollowableTopicSchemaType(
  schemaType: TopicSchemaTypeValue
): schemaType is FollowableTopicSchemaType {
  return FOLLOWABLE_SCHEMA_TYPES.has(schemaType as FollowableTopicSchemaType);
}
