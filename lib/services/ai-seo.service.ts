import { getAIModel } from "@/lib/services/settings.service";
import { callOpenAIWithRetry, extractContentFromCompletion } from "@/lib/services/ai-openai-client.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";

export interface AISEOMetadata {
    title: string;
    description: string;
    keywords: string[];
}

/**
 * Generates SEO-optimized metadata for a topic using AI.
 * 
 * @param topicName - The name of the sports topic
 * @param currentDescription - Current description if available
 * @returns AI-generated SEO metadata
 */
export async function generateTopicMetadataAI(
    topicName: string,
    currentDescription?: string | null
): Promise<AISEOMetadata | null> {
    try {
        const aiModel = await getAIModel();
        const isO1 = aiModel.startsWith("o1");

        const prefix = `SEO GENERATION MISSION:
- Target Topic: ${topicName}
- Current Narrative: ${currentDescription || "None provided"}
`;

        const instructions = `You are an elite SEO strategist and high-conversion copywriter.
Goal: Dominant, curiosity-driven SEO metadata for "${topicName}".

# JSON SCHEMA REQUIREMENTS
{
  "title": "Elite, curiosity-driven title (Max 60 chars)",
  "description": "High-conversion meta description (Max 160 chars).",
  "keywords": ["7-10 high-intent keywords"]
}

# ELITE COPYWRITING GUIDELINES
1. THE HOOK: Primary keyword must appear in the first 20 characters. Use "Power Words".
2. THE NARRATIVE: Use PAC (Problem-Agitate-Solve) or HVA (Hook-Value-Action) framework.
3. CONTEXT: Speark to the "Hardcore Fan" persona.
4. INTEGRITY: Output ONLY valid JSON.`;

        const prompt = prefix + instructions;

        let systemMessage = "You are a specialized SEO metadata generator for sports trivia.";
        if (isO1) {
            systemMessage = "You are a specialized SEO metadata generator for sports trivia. Output strictly JSON.";
        }

        const completion = await callOpenAIWithRetry(
            aiModel,
            prompt,
            systemMessage,
            {
                temperature: 0.7,
                maxTokens: 500,
                responseFormat: isO1 ? null : { type: "json_object" },
                cacheable: true,
                cacheKeyContext: { topicName, type: "topic_metadata" },
            }
        );

        const content = extractContentFromCompletion(completion, aiModel);
        const cleaned = extractJSON(content);
        const parsed = JSON.parse(cleaned);

        return {
            title: parsed.title || `${topicName} Trivia & Stats`,
            description: parsed.description || `Explore the ultimate collection of trivia, records, and history for ${topicName}.`,
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [topicName, "trivia", "sports"],
        };
    } catch (error) {
        console.error(`[AI SEO] Failed to generate metadata for ${topicName}:`, error);
        return null;
    }
}
/**
 * Generates SEO-optimized metadata for a quiz using AI.
 * 
 * @param quizTitle - The title of the quiz
 * @param description - Quiz description
 * @returns AI-generated SEO metadata
 */
export async function generateQuizMetadataAI(
    quizTitle: string,
    description?: string | null
): Promise<AISEOMetadata | null> {
    try {
        const aiModel = await getAIModel();
        const isO1 = aiModel.startsWith("o1");

        const prefix = `SEO GENERATION MISSION:
- Quiz Title: ${quizTitle}
- Quiz Narrative: ${description || "None provided"}
`;

        const instructions = `You are an elite SEO strategist specializing in gamified sports content.
Goal: Designs that trigger the "Competitor Mindset" for "${quizTitle}".

# JSON SCHEMA REQUIREMENTS
{
  "title": "Challenging, keyword-rich title (Max 60 chars)",
  "description": "Compelling, CTA-driven meta description (Max 160 chars).",
  "keywords": ["7-10 competitive keywords"]
}

# CONVERSION GUIDELINES
1. THE CHALLENGE: Include "Quiz", "Trivia", or "Test". Use a hook that implies exclusivity.
2. THE PAYOFF: [Intriguing Hook] + [What They'll Prove] + [Urgent CTA]. 140-160 chars.
3. TONE: Hard-hitting, competitive.
4. INTEGRITY: Output STRICTLY valid JSON.`;

        const prompt = prefix + instructions;

        let systemMessage = "You are a specialized SEO metadata generator for sports trivia quizzes.";
        if (isO1) {
            systemMessage = "You are a specialized SEO metadata generator for sports trivia quizzes. Output strictly JSON.";
        }

        const completion = await callOpenAIWithRetry(
            aiModel,
            prompt,
            systemMessage,
            {
                temperature: 0.7,
                maxTokens: 500,
                responseFormat: isO1 ? null : { type: "json_object" },
                cacheable: true,
                cacheKeyContext: { quizTitle, type: "quiz_metadata" },
            }
        );

        const content = extractContentFromCompletion(completion, aiModel);
        const cleaned = extractJSON(content);
        const parsed = JSON.parse(cleaned);

        return {
            title: parsed.title || `${quizTitle} Trivia Quiz`,
            description: parsed.description || `Test your knowledge with the ultimate ${quizTitle} trivia challenge.`,
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [quizTitle, "trivia", "quiz"],
        };
    } catch (error) {
        console.error(`[AI SEO] Failed to generate metadata for ${quizTitle}:`, error);
        return null;
    }
}
