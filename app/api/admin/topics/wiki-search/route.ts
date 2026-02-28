import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, BadRequestError, NotFoundError, successResponse } from "@/lib/errors";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

const wikiSearchSchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters"),
});

type WikiSearchResult = {
  title: string;
  pageid: number;
};

type TopicWikiMetadata = {
  query: string;
  title: string;
  description: string | null;
  extract: string | null;
  schemaType: TopicSchemaTypeValue;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
  sportName: string;
  leagueName: string;
  organizationName: string;
  teamName: string;
  nationality: string;
  birthDate: string;
  startDate: string;
  endDate: string;
  locationName: string;
  organizerName: string;
  aliases: string[];
  imageUrl: string | null;
};

type WikidataEntity = {
  id: string;
  labels?: Record<string, { language: string; value: string }>;
  descriptions?: Record<string, { language: string; value: string }>;
  aliases?: Record<string, Array<{ language: string; value: string }>>;
  claims?: Record<string, unknown[]>;
};

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractPageFromQuery(data: any): {
  title: string;
  fullUrl: string | null;
  description: string | null;
  extract: string | null;
  wikidataId: string | null;
  imageUrl: string | null;
} {
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const page = pages[0] as any;
  if (!page || page.missing !== undefined) {
    throw new NotFoundError("No Wikipedia page details found");
  }

  return {
    title: stringOrEmpty(page.title),
    fullUrl: stringOrEmpty(page.fullurl) || null,
    description: stringOrEmpty(page.description) || null,
    extract: stringOrEmpty(page.extract) || null,
    wikidataId: stringOrEmpty(page.pageprops?.wikibase_item) || null,
    imageUrl: stringOrEmpty(page.original?.source) || null,
  };
}

function getEntityLabel(entity: WikidataEntity | undefined): string {
  if (!entity) return "";
  return entity.labels?.en?.value?.trim() || "";
}

function getEntityAliases(entity: WikidataEntity | undefined): string[] {
  if (!entity?.aliases?.en) return [];
  return entity.aliases.en
    .map((item) => item.value.trim())
    .filter(Boolean);
}

function getClaimSnaks(entity: WikidataEntity | undefined, prop: string): any[] {
  if (!entity?.claims || !Array.isArray(entity.claims[prop])) return [];
  return entity.claims[prop] as any[];
}

function getEntityIdValues(entity: WikidataEntity | undefined, prop: string): string[] {
  const ids = new Set<string>();
  const snaks = getClaimSnaks(entity, prop);
  for (const snak of snaks) {
    const id = snak?.mainsnak?.datavalue?.value?.id;
    if (typeof id === "string" && id) ids.add(id);
  }
  return Array.from(ids);
}

function getFirstTimeValue(entity: WikidataEntity | undefined, prop: string): string {
  const snaks = getClaimSnaks(entity, prop);
  for (const snak of snaks) {
    const timeValue = snak?.mainsnak?.datavalue?.value?.time;
    if (typeof timeValue === "string" && timeValue) {
      const normalized = timeValue.replace(/^\+/, "");
      const datePart = normalized.split("T")[0];
      return datePart || normalized;
    }
  }
  return "";
}

function inferSchemaType(input: {
  description: string;
  title: string;
  categoryHints: string[];
  instanceHints: string[];
}): TopicSchemaTypeValue {
  const haystack = [
    input.description,
    input.title,
    ...input.categoryHints,
    ...input.instanceHints,
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(athlete|player|footballer|cricketer|basketball player|tennis player|golfer)\b/.test(haystack)) {
    return "ATHLETE";
  }
  if (/\b(team|club|fc|national team|franchise)\b/.test(haystack)) {
    return "SPORTS_TEAM";
  }
  if (/\b(tournament|cup|championship|final|olympic|world cup|event|season)\b/.test(haystack)) {
    return "SPORTS_EVENT";
  }
  if (/\b(league|association|federation|confederation|governing body|organization|organisation)\b/.test(haystack)) {
    return "SPORTS_ORGANIZATION";
  }
  if (/\b(sport|discipline|game)\b/.test(haystack)) {
    return "SPORT";
  }
  return "NONE";
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { query } = wikiSearchSchema.parse(body);

    const queryText = query.trim();
    if (!queryText) {
      throw new BadRequestError("Query is required");
    }

    const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("list", "search");
    searchUrl.searchParams.set("srsearch", queryText);
    searchUrl.searchParams.set("srlimit", "1");
    searchUrl.searchParams.set("format", "json");

    const searchResponse = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!searchResponse.ok) {
      throw new Error("Failed to search Wikipedia");
    }
    const searchJson = await searchResponse.json();
    const firstResult = (searchJson?.query?.search?.[0] || null) as WikiSearchResult | null;
    if (!firstResult || !firstResult.title) {
      throw new NotFoundError(`No Wikipedia result found for "${queryText}"`);
    }

    const pageUrl = new URL("https://en.wikipedia.org/w/api.php");
    pageUrl.searchParams.set("action", "query");
    pageUrl.searchParams.set("prop", "info|pageprops|extracts|pageimages|categories|description");
    pageUrl.searchParams.set("inprop", "url");
    pageUrl.searchParams.set("ppprop", "wikibase_item");
    pageUrl.searchParams.set("exintro", "1");
    pageUrl.searchParams.set("explaintext", "1");
    pageUrl.searchParams.set("piprop", "original");
    pageUrl.searchParams.set("cllimit", "20");
    pageUrl.searchParams.set("titles", firstResult.title);
    pageUrl.searchParams.set("format", "json");

    const pageResponse = await fetch(pageUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!pageResponse.ok) {
      throw new Error("Failed to fetch Wikipedia page");
    }
    const pageJson = await pageResponse.json();
    const page = extractPageFromQuery(pageJson);

    const categoryHints: string[] = ((pageJson?.query?.pages && Object.values(pageJson.query.pages)[0] as any)?.categories || [])
      .map((item: any) => stringOrEmpty(item?.title))
      .filter(Boolean);

    let wikidataEntity: WikidataEntity | undefined;
    let wikidataLinkedEntities: Record<string, WikidataEntity> = {};

    if (page.wikidataId) {
      const entityUrl = new URL("https://www.wikidata.org/w/api.php");
      entityUrl.searchParams.set("action", "wbgetentities");
      entityUrl.searchParams.set("ids", page.wikidataId);
      entityUrl.searchParams.set("languages", "en");
      entityUrl.searchParams.set("props", "labels|descriptions|aliases|claims");
      entityUrl.searchParams.set("format", "json");

      const entityResponse = await fetch(entityUrl.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (entityResponse.ok) {
        const entityJson = await entityResponse.json();
        wikidataEntity = entityJson?.entities?.[page.wikidataId] as WikidataEntity | undefined;

        const linkedEntityIds = new Set<string>([
          ...getEntityIdValues(wikidataEntity, "P31"),
          ...getEntityIdValues(wikidataEntity, "P641"),
          ...getEntityIdValues(wikidataEntity, "P54"),
          ...getEntityIdValues(wikidataEntity, "P118"),
          ...getEntityIdValues(wikidataEntity, "P17"),
          ...getEntityIdValues(wikidataEntity, "P27"),
          ...getEntityIdValues(wikidataEntity, "P159"),
        ]);

        if (linkedEntityIds.size > 0) {
          const linkedUrl = new URL("https://www.wikidata.org/w/api.php");
          linkedUrl.searchParams.set("action", "wbgetentities");
          linkedUrl.searchParams.set("ids", Array.from(linkedEntityIds).join("|"));
          linkedUrl.searchParams.set("languages", "en");
          linkedUrl.searchParams.set("props", "labels|descriptions");
          linkedUrl.searchParams.set("format", "json");

          const linkedResponse = await fetch(linkedUrl.toString(), {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });

          if (linkedResponse.ok) {
            const linkedJson = await linkedResponse.json();
            wikidataLinkedEntities = (linkedJson?.entities || {}) as Record<string, WikidataEntity>;
          }
        }
      }
    }

    const instanceHints = getEntityIdValues(wikidataEntity, "P31")
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .filter(Boolean);

    const schemaType = inferSchemaType({
      description: [page.description, getEntityLabel(wikidataEntity)].filter(Boolean).join(" "),
      title: page.title,
      categoryHints,
      instanceHints,
    });

    const sportName = getEntityIdValues(wikidataEntity, "P641")
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .find(Boolean) || "";
    const teamName = getEntityIdValues(wikidataEntity, "P54")
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .find(Boolean) || "";
    const leagueName = getEntityIdValues(wikidataEntity, "P118")
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .find(Boolean) || "";
    const organizationName = getEntityIdValues(wikidataEntity, "P159")
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .find(Boolean) || "";
    const nationality = [
      ...getEntityIdValues(wikidataEntity, "P27"),
      ...getEntityIdValues(wikidataEntity, "P17"),
    ]
      .map((id) => getEntityLabel(wikidataLinkedEntities[id]))
      .find(Boolean) || "";

    const birthDate = getFirstTimeValue(wikidataEntity, "P569");
    const startDate = getFirstTimeValue(wikidataEntity, "P580");
    const endDate = getFirstTimeValue(wikidataEntity, "P582");

    const sameAs = new Set<string>();
    if (page.fullUrl) sameAs.add(page.fullUrl);
    if (page.wikidataId) sameAs.add(`https://www.wikidata.org/wiki/${page.wikidataId}`);

    const metadata: TopicWikiMetadata = {
      query: queryText,
      title: page.title,
      description: page.description,
      extract: page.extract,
      schemaType,
      schemaCanonicalUrl: page.fullUrl,
      schemaSameAs: Array.from(sameAs),
      sportName,
      leagueName,
      organizationName,
      teamName,
      nationality,
      birthDate,
      startDate,
      endDate,
      locationName: "",
      organizerName: "",
      aliases: getEntityAliases(wikidataEntity).slice(0, 10),
      imageUrl: page.imageUrl,
    };

    return successResponse(metadata);
  } catch (error) {
    return handleError(error);
  }
}
