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

function buildFallbackSections(topicName: string, claimTexts: string[], sources: Array<{ sourceName: string; sourceUrl: string }>): GeneratedSections {
  const topClaims = claimTexts.slice(0, 12);
  const keyFacts = topClaims.map((c) => `- ${c}`).join("\n");
  const timeline = topClaims.filter((c) => /\b\d{4}\b/.test(c)).slice(0, 6).map((c) => `- ${c}`).join("\n");
  const sourceLines = sources.map((s) => `- [${s.sourceName}](${s.sourceUrl})`).join("\n");
  return {
    title: `${topicName}: Facts, Timeline & Trivia Insights`,
    metaDescription: `Explore key facts, context, and frequently asked questions about ${topicName}.`,
    introMd: `This page summarizes verified facts and context about **${topicName}** using source-grounded records.`,
    keyFactsMd: keyFacts || "- No verified facts yet.",
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
    take: 50,
    select: { claimText: true, confidence: true },
  });

  const docs = await prisma.topicSourceDocument.findMany({
    where: { topicId, isCommercialSafe: true },
    orderBy: { retrievedAt: "desc" },
    take: 25,
    select: { sourceName: true, sourceUrl: true },
  });

  const claimTexts = claims.map((c) => c.claimText);
  let sections = buildFallbackSections(topic.name, claimTexts, docs);

  if (claimTexts.length > 0) {
    try {
      const aiModel = await getAIModel();
      const prompt = [
        "Generate JSON with keys:",
        "title, metaDescription, introMd, keyFactsMd, timelineMd, analysisMd, faqMd, sourcesMd",
        "Rules:",
        "- Ground ONLY in provided claims",
        "- Keep markdown concise and original",
        "- keyFactsMd should be markdown bullets",
        "- faqMd should include 4 Q&A sections",
        "- sourcesMd must preserve URLs",
        "",
        `Topic: ${topic.name}`,
        `Claims: ${JSON.stringify(claimTexts)}`,
        `Sources: ${JSON.stringify(docs)}`,
      ].join("\n");

      const completion = await callOpenAIWithRetry(
        aiModel,
        prompt,
        "You produce valid JSON only.",
        {
          temperature: 0.3,
          maxTokens: 1800,
          responseFormat: aiModel.startsWith("o1") ? null : { type: "json_object" },
          cacheable: true,
          cacheKeyContext: { type: "topic_content_snapshot", topicId },
        }
      );
      const content = extractContentFromCompletion(completion, aiModel);
      const parsed = parseJsonSafely<Partial<GeneratedSections>>(content);
      if (parsed?.title && parsed.metaDescription && parsed.introMd && parsed.keyFactsMd && parsed.analysisMd && parsed.faqMd && parsed.sourcesMd) {
        sections = {
          title: parsed.title,
          metaDescription: parsed.metaDescription,
          introMd: parsed.introMd,
          keyFactsMd: parsed.keyFactsMd,
          timelineMd: parsed.timelineMd,
          analysisMd: parsed.analysisMd,
          faqMd: parsed.faqMd,
          sourcesMd: parsed.sourcesMd,
        };
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
