import { z } from "zod";
import { TOPIC_SCHEMA_TYPES, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";

export const topicSchemaTypeSchema = z.enum(TOPIC_SCHEMA_TYPES);

const urlOrNullish = z.string().url().optional().nullable();
const stringOrNullish = z.string().min(1).optional().nullable();

const sportEntityDataSchema = z
  .object({
    aliases: z.array(z.string().min(1)).max(20).optional(),
    governingBodyName: stringOrNullish,
    governingBodyUrl: urlOrNullish,
  })
  .strict();

const sportsTeamEntityDataSchema = z
  .object({
    sportName: stringOrNullish,
    leagueName: stringOrNullish,
    leagueUrl: urlOrNullish,
    organizationName: stringOrNullish,
    organizationUrl: urlOrNullish,
  })
  .strict();

const athleteEntityDataSchema = z
  .object({
    sportName: stringOrNullish,
    teamName: stringOrNullish,
    nationality: stringOrNullish,
    birthDate: z.string().datetime().optional().nullable(),
  })
  .strict();

const sportsOrganizationEntityDataSchema = z
  .object({
    sportName: stringOrNullish,
  })
  .strict();

const sportsEventEntityDataSchema = z
  .object({
    sportName: stringOrNullish,
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    locationName: stringOrNullish,
    locationUrl: urlOrNullish,
    organizerName: stringOrNullish,
    organizerUrl: urlOrNullish,
  })
  .strict();

type JsonRecord = Record<string, unknown>;

export function sanitizeUrlList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

export function parseTopicEntityData(
  schemaType: TopicSchemaTypeValue,
  entityData: unknown
): JsonRecord | null {
  if (entityData == null) {
    return null;
  }

  if (schemaType === "NONE") {
    return null;
  }

  let parsed: JsonRecord;
  switch (schemaType) {
    case "SPORT":
      parsed = sportEntityDataSchema.parse(entityData);
      break;
    case "SPORTS_TEAM":
      parsed = sportsTeamEntityDataSchema.parse(entityData);
      break;
    case "ATHLETE":
      parsed = athleteEntityDataSchema.parse(entityData);
      break;
    case "SPORTS_ORGANIZATION":
      parsed = sportsOrganizationEntityDataSchema.parse(entityData);
      break;
    case "SPORTS_EVENT":
      parsed = sportsEventEntityDataSchema.parse(entityData);
      break;
    default:
      parsed = {};
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
}

export function requiresCanonicalUrl(schemaType: TopicSchemaTypeValue): boolean {
  return schemaType !== "NONE";
}
