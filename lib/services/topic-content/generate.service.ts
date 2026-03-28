import { prisma } from "@/lib/db";
import { callOpenAIWithRetry, extractContentFromCompletion } from "@/lib/services/ai-openai-client.service";
import { getAIModel } from "@/lib/services/settings.service";

type GeneratedSections = {
  title: string;
  metaDescription: string;
  introMd: string;
  keyFactsMd: string;
  timelineMd?: string;
  analysisMd: string;
  faqMd: string;
  sourcesMd: string;
};

const MIN_KEY_FACTS = 8;
const MIN_FAQ_PAIRS = 4;
const MIN_SOURCE_LINKS = 2;
const MIN_TOTAL_WORDS = 130;

type SectionValidation = {
  ok: boolean;
  reasons: string[];
};

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countBulletLines(md: string): number {
  return (md.match(/(?:^|\n)-\s+/g) ?? []).length;
}

function countFaqPairs(md: string): number {
  const compactPairs = (md.match(/(?:^|\n)-\s*Q:/g) ?? []).length;
  const headingPairs = (md.match(/(?:^|\n)###\s+/g) ?? []).length;
  return Math.max(compactPairs, headingPairs);
}

function countUniqueLinks(text: string): number {
  const matches = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return new Set(matches.map((item) => item.toLowerCase())).size;
}

function validateGeneratedSections(sections: GeneratedSections): SectionValidation {
  const reasons: string[] = [];
  const keyFactsCount = countBulletLines(sections.keyFactsMd);
  const faqCount = countFaqPairs(sections.faqMd);
  const sourceLinkCount = countUniqueLinks(sections.sourcesMd);
  const totalWords = countWords(
    [
      sections.introMd,
      sections.keyFactsMd,
      sections.timelineMd ?? "",
      sections.analysisMd,
      sections.faqMd,
    ].join("\n\n")
  );

  if (keyFactsCount < MIN_KEY_FACTS) {
    reasons.push(`keyFactsMd must include at least ${MIN_KEY_FACTS} bullet facts (found ${keyFactsCount})`);
  }
  if (faqCount < MIN_FAQ_PAIRS) {
    reasons.push(`faqMd must include at least ${MIN_FAQ_PAIRS} Q/A pairs (found ${faqCount})`);
  }
  if (sourceLinkCount < MIN_SOURCE_LINKS) {
    reasons.push(`sourcesMd must include at least ${MIN_SOURCE_LINKS} unique source links (found ${sourceLinkCount})`);
  }
  if (totalWords < MIN_TOTAL_WORDS) {
    reasons.push(`content is too short; minimum ${MIN_TOTAL_WORDS} words required (found ${totalWords})`);
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

function buildGenerationPrompt(input: {
  topicName: string;
  claimTexts: string[];
  sources: Array<{ sourceName: string; sourceUrl: string }>;
  strictFeedback?: string[];
}) {
  const feedback = input.strictFeedback?.length
    ? [
        "Previous draft failed these checks. Fix all of them:",
        ...input.strictFeedback.map((reason, index) => `${index + 1}. ${reason}`),
        "",
      ]
    : [];

  return [
    "You are a sports-trivia content writer.",
    "Return ONLY valid JSON with keys:",
    "title, metaDescription, introMd, keyFactsMd, timelineMd, analysisMd, faqMd, sourcesMd",
    "",
    "Non-negotiable requirements:",
    `- keyFactsMd: ${MIN_KEY_FACTS}-14 markdown bullets, each a concrete fact.`,
    "- At least 3 key facts should include numeric specificity when available (dates, counts, records).",
    "- Claims may include machine paths (for example 'claims.awardReceived[0]: ...'). Rewrite these into natural-language facts.",
    "- Ignore metadata-like claims (ids, hashes, internal URLs, technical keys) even if they appear in inputs.",
    "- Avoid generic statements like 'is important' unless tied to a verifiable fact.",
    `- faqMd: at least ${MIN_FAQ_PAIRS} Q/A pairs in markdown using '- Q:' and 'A:' format.`,
    "- sourcesMd: include at least 2 unique full URLs in markdown bullet list, no placeholders.",
    "- Ground ONLY in provided claims and sources. Do not invent facts.",
    "- Keep copy original, concise, and high-signal for search answers.",
    "",
    ...feedback,
    `Topic: ${input.topicName}`,
    `Claims: ${JSON.stringify(input.claimTexts)}`,
    `Sources: ${JSON.stringify(input.sources)}`,
  ].join("\n");
}

function buildFallbackSections(topicName: string, claimTexts: string[], sources: Array<{ sourceName: string; sourceUrl: string }>): GeneratedSections {
  const topClaims = claimTexts.slice(0, 20);
  const keyFacts = topClaims.map((c) => `- ${c}`).join("\n");
  const timeline = topClaims.filter((c) => /\b\d{4}\b/.test(c)).slice(0, 6).map((c) => `- ${c}`).join("\n");
  const sourceLines = sources.map((s) => `- [${s.sourceName}](${s.sourceUrl})`).join("\n");
  return {
    title: `${topicName}: Facts, Timeline & Trivia Insights`,
    metaDescription: `Explore key facts, context, and frequently asked questions about ${topicName}.`,
    introMd: `This page summarizes verified facts and context about **${topicName}** using source-grounded records for trivia discovery.`,
    keyFactsMd:
      keyFacts ||
      [
        "- No verified facts extracted yet.",
        "- Add more source-backed claims through ingestion.",
        "- Ensure source URLs are valid and accessible.",
        "- Verify claims are selected for publish.",
        "- Re-run generation after new claims are available.",
        "- Check topic aliases and identifiers.",
        "- Ensure at least two sources are linked.",
        "- Include date-based claims where possible.",
        "- Include record or achievement claims where possible.",
        "- Include role/nationality claims where possible.",
      ].join("\n"),
    timelineMd: timeline || undefined,
    analysisMd: `The dataset indicates how ${topicName} connects to quizzes and broader sports knowledge graphs.`,
    faqMd: [
      `### What is ${topicName}?`,
      `${topicName} is covered here through verified source-derived claims and structured summaries.`,
      `### Why does ${topicName} matter in sports trivia?`,
      `It appears across quiz topics, records, and entity relationships that improve learning and discovery.`,
      `### How often is this topic refreshed?`,
      `Refreshes run through the topic content ingestion pipeline.`,
      `### Are the facts source-backed?`,
      `Yes. Claims are selected from ingested source documents with attribution.`,
    ].join("\n\n"),
    sourcesMd: sourceLines || "- No sources recorded.",
  };
}

function parseJsonSafely<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function generateTopicContentSnapshot(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, name: true },
  });
  if (!topic) throw new Error("Topic not found");

  const claims = await prisma.topicClaim.findMany({
    where: { topicId, isSelectedForPublish: true, isContradicted: false },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    take: 75,
    select: { claimText: true, confidence: true },
  });

  const docs = await prisma.topicSourceDocument.findMany({
    where: { topicId },
    orderBy: { retrievedAt: "desc" },
    take: 25,
    select: { sourceName: true, sourceUrl: true },
  });

  const claimTexts = claims.map((c) => c.claimText);
  let sections = buildFallbackSections(topic.name, claimTexts, docs);

  if (claimTexts.length > 0) {
    try {
      const aiModel = await getAIModel();
      let strictFeedback: string[] | undefined;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const prompt = buildGenerationPrompt({
          topicName: topic.name,
          claimTexts,
          sources: docs,
          strictFeedback,
        });

        const completion = await callOpenAIWithRetry(
          aiModel,
          prompt,
          "You produce valid JSON only.",
          {
            temperature: 0.2,
            maxTokens: 2200,
            responseFormat: aiModel.startsWith("o1") ? null : { type: "json_object" },
            cacheable: true,
            cacheKeyContext: { type: "topic_content_snapshot", topicId, attempt },
          }
        );
        const content = extractContentFromCompletion(completion, aiModel);
        const parsed = parseJsonSafely<Partial<GeneratedSections>>(content);
        if (
          parsed?.title &&
          parsed.metaDescription &&
          parsed.introMd &&
          parsed.keyFactsMd &&
          parsed.analysisMd &&
          parsed.faqMd &&
          parsed.sourcesMd
        ) {
          const candidate: GeneratedSections = {
            title: parsed.title,
            metaDescription: parsed.metaDescription,
            introMd: parsed.introMd,
            keyFactsMd: parsed.keyFactsMd,
            timelineMd: parsed.timelineMd,
            analysisMd: parsed.analysisMd,
            faqMd: parsed.faqMd,
            sourcesMd: parsed.sourcesMd,
          };
          const validation = validateGeneratedSections(candidate);
          if (validation.ok) {
            sections = candidate;
            break;
          }
          strictFeedback = validation.reasons;
        } else {
          strictFeedback = ["JSON shape invalid or missing required keys."];
        }
      }
    } catch {
      // fallback already prepared
    }
  }

  const latest = await prisma.topicContentSnapshot.findFirst({
    where: { topicId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const snapshot = await prisma.topicContentSnapshot.create({
    data: {
      topicId,
      version: nextVersion,
      status: "DRAFT",
      ...sections,
    },
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { contentStatus: "DRAFT" },
  });

  return snapshot;
}
