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

        const prompt = `You are an SEO expert specializing in sports content.
Generate high-ranking SEO metadata for the sports topic: "${topicName}".

${currentDescription ? `Current context: "${currentDescription}"` : ""}

Goal: Create a Title tag and Meta Description that maximizes Click-Through Rate (CTR) and search relevance.

🧾 Required JSON Format:
{
  "title": "A catchy, SEO-optimized title (Max 60 chars)",
  "description": "A compelling meta description (Max 160 chars) including keywords.",
  "keywords": ["5-7 relevant keywords including the topic name"]
}

📝 Guidelines:
- Title should be around 50-60 characters.
- Description should be 140-160 characters.
- Use power words (e.g., Ultimate, Records, Legends, Trivia).
- Target passionate sports fans.
- Output strictly valid JSON. No conversational filler.`;

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

        const prompt = `You are an SEO expert specializing in sports trivia.
Generate high-ranking SEO metadata for the sports quiz: "${quizTitle}".

${description ? `Context: "${description}"` : ""}

Goal: Create a Title tag and Meta Description that maximizes Click-Through Rate (CTR) and search relevance for fans looking for a challenge.

🧾 Required JSON Format:
{
  "title": "A catchy, SEO-optimized title (Max 60 chars)",
  "description": "A compelling meta description (Max 160 chars) including keywords.",
  "keywords": ["5-7 relevant keywords including the quiz topic"]
}

📝 Guidelines:
- Title should be around 50-60 characters and include "Quiz" or "Trivia".
- Description should be 140-160 characters and include a call to action (e.g., "Play now", "Test your knowledge").
- Target competitive sports fans.
- Output strictly valid JSON. No conversational filler.`;

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
