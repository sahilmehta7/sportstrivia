import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { evaluateSourcePolicy } from "@/lib/content/source-policy";

type CollectMode = "full" | "refresh";
type WikidataEntitiesResponse = {
  entities?: Record<string, any>;
};

function makeHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function parseWikidataEntityId(url: string): string | null {
  const match = url.match(/wikidata\.org\/wiki\/(Q\d+)/i);
  return match?.[1] ?? null;
}

function firstLanguageValue(input: Record<string, any> | undefined, preferred = "en"): string | null {
  if (!input) return null;
  if (input[preferred]?.value) return String(input[preferred].value);
  const first = Object.values(input)[0] as any;
  if (first?.value) return String(first.value);
  return null;
}

function parseWikidataValue(datavalue: any): string | null {
  const value = datavalue?.value;
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    if (typeof value.id === "string") return value.id;
    if (typeof value.time === "string") return value.time;
    if (typeof value.text === "string") return value.text;
    if (typeof value.amount === "string") return value.amount;
  }
  return null;
}

async function searchWikidataEntityId(topicName: string): Promise<string | null> {
  const endpoint = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(topicName)}&language=en&format=json&limit=1`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { search?: Array<{ id?: string }> };
  const id = data.search?.[0]?.id;
  return typeof id === "string" ? id : null;
}

async function fetchWikidataPayload(input: { sourceUrl: string; topicName: string }): Promise<Record<string, unknown>> {
  const entityId = parseWikidataEntityId(input.sourceUrl) ?? (await searchWikidataEntityId(input.topicName));
  if (!entityId) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      entityId: null,
    };
  }

  const entityEndpoint = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
  const response = await fetch(entityEndpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      entityId,
      fetchError: `Wikidata entity fetch failed: HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as WikidataEntitiesResponse;
  const entity = data.entities?.[entityId];
  if (!entity) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      entityId,
      fetchError: "Wikidata entity not found in response",
    };
  }

  const claimFields: Array<[string, string]> = [
    ["P31", "instanceOf"],
    ["P106", "occupation"],
    ["P641", "sport"],
    ["P27", "countryOfCitizenship"],
    ["P54", "memberOfSportsTeam"],
    ["P166", "awardReceived"],
    ["P569", "dateOfBirth"],
    ["P570", "dateOfDeath"],
  ];

  const claims: Record<string, string[]> = {};
  for (const [propertyId, propertyName] of claimFields) {
    const statements: any[] = Array.isArray(entity.claims?.[propertyId]) ? entity.claims[propertyId] : [];
    const values = statements
      .map((statement) => parseWikidataValue(statement?.mainsnak?.datavalue))
      .filter((value): value is string => Boolean(value))
      .slice(0, 20);
    if (values.length > 0) {
      claims[propertyName] = values;
    }
  }

  const aliases =
    (Array.isArray(entity.aliases?.en)
      ? entity.aliases.en.map((alias: any) => alias?.value).filter(Boolean)
      : []) as string[];
  const wikipediaTitle = entity.sitelinks?.enwiki?.title ? String(entity.sitelinks.enwiki.title) : null;

  return {
    topic: input.topicName,
    sourceUrl: input.sourceUrl,
    entityId,
    label: firstLanguageValue(entity.labels),
    description: firstLanguageValue(entity.descriptions),
    aliases: aliases.slice(0, 20),
    wikipediaTitle,
    wikipediaUrl: wikipediaTitle
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaTitle.replace(/\s+/g, "_"))}`
      : null,
    claims,
  };
}

function inferSources(topic: {
  name: string;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
}) {
  const candidates: Array<{ sourceName: string; sourceUrl: string; payload: Record<string, unknown> }> = [];

  if (topic.schemaCanonicalUrl) {
    const url = topic.schemaCanonicalUrl;
    const lower = url.toLowerCase();
    if (lower.includes("wikidata.org")) {
      candidates.push({ sourceName: "wikidata", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("openalex.org")) {
      candidates.push({ sourceName: "openalex", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("crossref.org")) {
      candidates.push({ sourceName: "crossref", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("wikipedia.org")) {
      candidates.push({ sourceName: "wikipedia", sourceUrl: url, payload: { url, topic: topic.name } });
    }
  }

  for (const url of topic.schemaSameAs) {
    const lower = url.toLowerCase();
    if (lower.includes("wikidata.org")) {
      candidates.push({ sourceName: "wikidata", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("openalex.org")) {
      candidates.push({ sourceName: "openalex", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("crossref.org")) {
      candidates.push({ sourceName: "crossref", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("wikipedia.org")) {
      candidates.push({ sourceName: "wikipedia", sourceUrl: url, payload: { url, topic: topic.name } });
    }
  }

  // Always include a deterministic wikidata search URL fallback to keep pipeline viable.
  if (!candidates.some((c) => c.sourceName === "wikidata")) {
    const query = encodeURIComponent(topic.name);
    candidates.push({
      sourceName: "wikidata",
      sourceUrl: `https://www.wikidata.org/w/index.php?search=${query}`,
      payload: { query: topic.name },
    });
  }

  return candidates;
}

export async function collectTopicSourceDocuments(topicId: string, mode: CollectMode = "full") {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      name: true,
      schemaCanonicalUrl: true,
      schemaSameAs: true,
    },
  });

  if (!topic) {
    throw new Error("Topic not found");
  }

  const candidates = inferSources(topic);
  let inserted = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const policy = evaluateSourcePolicy(candidate.sourceName);
    if (!policy.allowed) {
      skipped++;
      continue;
    }

    let payload = candidate.payload;
    if (candidate.sourceName === "wikidata") {
      try {
        payload = await fetchWikidataPayload({
          sourceUrl: candidate.sourceUrl,
          topicName: topic.name,
        });
      } catch (error) {
        payload = {
          ...candidate.payload,
          fetchError: error instanceof Error ? error.message : "Unknown Wikidata fetch error",
        };
      }
    }

    const rawPayload = {
      ...payload,
      collectedAt: new Date().toISOString(),
      mode,
      sourceName: candidate.sourceName,
    };
    const hash = makeHash({
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      mode,
      payload,
    });

    try {
      await prisma.topicSourceDocument.create({
        data: {
          topicId,
          sourceName: candidate.sourceName,
          sourceUrl: candidate.sourceUrl,
          licenseType: policy.licenseType,
          isCommercialSafe: policy.isCommercialSafe,
          rawPayload,
          hash,
        },
      });
      inserted++;
    } catch {
      // Ignore duplicate unique collisions and continue.
      skipped++;
    }
  }

  return { inserted, skipped, totalCandidates: candidates.length };
}
