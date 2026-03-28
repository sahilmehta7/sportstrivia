import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { evaluateSourcePolicy } from "@/lib/content/source-policy";

type CollectMode = "full" | "refresh";
type WikidataEntitiesResponse = {
  entities?: Record<string, any>;
};
type OpenAlexWorkResponse = {
  id?: string;
  display_name?: string;
  publication_year?: number;
  cited_by_count?: number;
  doi?: string | null;
  primary_location?: {
    source?: { display_name?: string | null };
  } | null;
  authorships?: Array<{
    author?: { display_name?: string | null };
  }>;
  abstract_inverted_index?: Record<string, number[]>;
};
type CrossrefWorkResponse = {
  message?: {
    title?: string[];
    DOI?: string;
    type?: string;
    created?: { "date-time"?: string };
    issued?: { "date-parts"?: number[][] };
    publisher?: string;
    author?: Array<{ given?: string; family?: string; name?: string }>;
    abstract?: string;
    "container-title"?: string[];
    "is-referenced-by-count"?: number;
  };
};

function makeHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function parseWikidataEntityId(url: string): string | null {
  const match = url.match(/wikidata\.org\/wiki\/(Q\d+)/i);
  return match?.[1] ?? null;
}

function parseWikipediaTitle(url: string): string | null {
  const match = url.match(/wikipedia\.org\/wiki\/([^#?]+)/i);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]).replace(/_/g, " ");
}

function parseOpenAlexWorkId(url: string): string | null {
  const match = url.match(/openalex\.org\/(W\d+)/i);
  return match?.[1] ?? null;
}

function parseDoiFromUrl(url: string): string | null {
  const doiOrgMatch = url.match(/doi\.org\/(10\.[^/?#]+)/i);
  if (doiOrgMatch?.[1]) return decodeURIComponent(doiOrgMatch[1]);

  const crossrefMatch = url.match(/crossref\.org\/.*?(10\.[^/?#]+)/i);
  if (crossrefMatch?.[1]) return decodeURIComponent(crossrefMatch[1]);
  return null;
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

async function searchWikipediaTitle(topicName: string): Promise<string | null> {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topicName)}&utf8=1&format=json&srlimit=1`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { query?: { search?: Array<{ title?: string }> } };
  const title = data.query?.search?.[0]?.title;
  return typeof title === "string" ? title : null;
}

async function fetchWikipediaPayload(input: { sourceUrl: string; topicName: string }): Promise<Record<string, unknown>> {
  const title = parseWikipediaTitle(input.sourceUrl) ?? (await searchWikipediaTitle(input.topicName));
  if (!title) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      wikipediaTitle: null,
      fetchError: "Wikipedia title could not be resolved",
    };
  }

  const summaryEndpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
  const response = await fetch(summaryEndpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      wikipediaTitle: title,
      fetchError: `Wikipedia summary fetch failed: HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as {
    title?: string;
    description?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    timestamp?: string;
  };

  return {
    topic: input.topicName,
    sourceUrl: input.sourceUrl,
    wikipediaTitle: data.title ?? title,
    description: data.description ?? null,
    extract: data.extract ?? null,
    canonicalPageUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
    timestamp: data.timestamp ?? null,
  };
}

async function fetchOpenAlexPayload(input: { sourceUrl: string; topicName: string }): Promise<Record<string, unknown>> {
  const workId = parseOpenAlexWorkId(input.sourceUrl);
  if (!workId) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      fetchError: "OpenAlex work id not found in URL",
    };
  }

  const endpoint = `https://api.openalex.org/works/${workId}`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      workId,
      fetchError: `OpenAlex fetch failed: HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as OpenAlexWorkResponse;
  return {
    topic: input.topicName,
    sourceUrl: input.sourceUrl,
    workId,
    title: data.display_name ?? null,
    publicationYear: data.publication_year ?? null,
    citedByCount: data.cited_by_count ?? null,
    doi: data.doi ?? null,
    venue: data.primary_location?.source?.display_name ?? null,
    authors: (data.authorships ?? [])
      .map((a) => a.author?.display_name)
      .filter((v): v is string => Boolean(v))
      .slice(0, 15),
    abstractTermCount: data.abstract_inverted_index ? Object.keys(data.abstract_inverted_index).length : 0,
  };
}

async function fetchCrossrefPayload(input: { sourceUrl: string; topicName: string }): Promise<Record<string, unknown>> {
  const doi = parseDoiFromUrl(input.sourceUrl);
  if (!doi) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      fetchError: "DOI not found in Crossref URL",
    };
  }

  const endpoint = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return {
      topic: input.topicName,
      sourceUrl: input.sourceUrl,
      doi,
      fetchError: `Crossref fetch failed: HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as CrossrefWorkResponse;
  const message = data.message ?? {};
  const authors = (message.author ?? [])
    .map((author) => author.name ?? [author.given, author.family].filter(Boolean).join(" ").trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 15);
  const issued = message.issued?.["date-parts"]?.[0];
  const issuedDate = Array.isArray(issued) ? issued.join("-") : null;

  return {
    topic: input.topicName,
    sourceUrl: input.sourceUrl,
    doi: message.DOI ?? doi,
    title: Array.isArray(message.title) ? message.title[0] ?? null : null,
    type: message.type ?? null,
    publisher: message.publisher ?? null,
    createdAt: message.created?.["date-time"] ?? null,
    issuedDate,
    journal: Array.isArray(message["container-title"]) ? message["container-title"][0] ?? null : null,
    citedByCount: message["is-referenced-by-count"] ?? null,
    authors,
    abstract: message.abstract ?? null,
  };
}

function inferSources(topic: {
  name: string;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
}) {
  const candidates: Array<{ sourceName: string; sourceUrl: string; payload: Record<string, unknown> }> = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate: { sourceName: string; sourceUrl: string; payload: Record<string, unknown> }) => {
    const key = `${candidate.sourceName}::${candidate.sourceUrl.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  if (topic.schemaCanonicalUrl) {
    const url = topic.schemaCanonicalUrl;
    const lower = url.toLowerCase();
    if (lower.includes("wikidata.org")) {
      pushCandidate({ sourceName: "wikidata", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("openalex.org")) {
      pushCandidate({ sourceName: "openalex", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("crossref.org")) {
      pushCandidate({ sourceName: "crossref", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("wikipedia.org")) {
      pushCandidate({ sourceName: "wikipedia", sourceUrl: url, payload: { url, topic: topic.name } });
    }
  }

  for (const url of topic.schemaSameAs) {
    const lower = url.toLowerCase();
    if (lower.includes("wikidata.org")) {
      pushCandidate({ sourceName: "wikidata", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("openalex.org")) {
      pushCandidate({ sourceName: "openalex", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("crossref.org")) {
      pushCandidate({ sourceName: "crossref", sourceUrl: url, payload: { url, topic: topic.name } });
    } else if (lower.includes("wikipedia.org")) {
      pushCandidate({ sourceName: "wikipedia", sourceUrl: url, payload: { url, topic: topic.name } });
    }
  }

  // Always include a deterministic wikidata search URL fallback to keep pipeline viable.
  if (!candidates.some((c) => c.sourceName === "wikidata")) {
    const query = encodeURIComponent(topic.name);
    pushCandidate({
      sourceName: "wikidata",
      sourceUrl: `https://www.wikidata.org/w/index.php?search=${query}`,
      payload: { query: topic.name },
    });
  }

  // Add Wikipedia fallback for richer narrative facts.
  if (!candidates.some((c) => c.sourceName === "wikipedia")) {
    const title = encodeURIComponent(topic.name.replace(/\s+/g, "_"));
    pushCandidate({
      sourceName: "wikipedia",
      sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
      payload: { topic: topic.name },
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

  // Full mode is intended to rebuild source + claim material from scratch.
  // This prevents stale, metadata-only legacy claims from polluting verification/scoring.
  if (mode === "full") {
    await prisma.$transaction([
      prisma.topicClaim.deleteMany({ where: { topicId } }),
      prisma.topicSourceDocument.deleteMany({ where: { topicId } }),
    ]);
  }

  const candidates = inferSources(topic);
  let inserted = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const normalizedSourceName = candidate.sourceName.toLowerCase();
    const policy = evaluateSourcePolicy(normalizedSourceName);
    if (!policy.allowed) {
      skipped++;
      continue;
    }

    let payload = candidate.payload;
    if (normalizedSourceName === "wikidata") {
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
    } else if (normalizedSourceName === "wikipedia") {
      try {
        payload = await fetchWikipediaPayload({
          sourceUrl: candidate.sourceUrl,
          topicName: topic.name,
        });
      } catch (error) {
        payload = {
          ...candidate.payload,
          fetchError: error instanceof Error ? error.message : "Unknown Wikipedia fetch error",
        };
      }
    } else if (normalizedSourceName === "openalex") {
      try {
        payload = await fetchOpenAlexPayload({
          sourceUrl: candidate.sourceUrl,
          topicName: topic.name,
        });
      } catch (error) {
        payload = {
          ...candidate.payload,
          fetchError: error instanceof Error ? error.message : "Unknown OpenAlex fetch error",
        };
      }
    } else if (normalizedSourceName === "crossref") {
      try {
        payload = await fetchCrossrefPayload({
          sourceUrl: candidate.sourceUrl,
          topicName: topic.name,
        });
      } catch (error) {
        payload = {
          ...candidate.payload,
          fetchError: error instanceof Error ? error.message : "Unknown Crossref fetch error",
        };
      }
    }

    const rawPayload = {
      ...payload,
      collectedAt: new Date().toISOString(),
      mode,
      sourceName: normalizedSourceName,
    };
    const hash = makeHash({
      sourceName: normalizedSourceName,
      sourceUrl: candidate.sourceUrl,
      mode,
      payload,
    });

    try {
      await prisma.topicSourceDocument.create({
        data: {
          topicId,
          sourceName: normalizedSourceName,
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
