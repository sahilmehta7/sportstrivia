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

        const prompt = `You are an elite SEO strategist and high-conversion copywriter specializing in the sports industry.
Your mission is to generate high-ranking, "clickable" SEO metadata for the sports topic: "${topicName}".

${currentDescription ? `Context & Narrative: "${currentDescription}"` : ""}

Goal: Create a Title tag and Meta Description that doesn't just rank—it dominates the SERP by triggering curiosity and authority.

🧾 REQUIRED JSON FORMAT:
{
  "title": "Elite, curiosity-driven title (Max 60 chars)",
  "description": "High-conversion meta description (Max 160 chars) including placeholders for value and action.",
  "keywords": ["7-10 high-intent keywords including the topic name"]
}

📝 ELITE COPYWRITING GUIDELINES:
1. THE HOOK (Title): Primary keyword must appear in the first 20 characters. Use "Power Words" (e.g., Masterclass, Untold, Legends, Statistics, Ultimate). Avoid generic titles like "Cricket Trivia".
2. THE NARRATIVE (Description): Use the "Problem-Agitate-Solve" or "Hook-Value-Action" framework. 
   - Example Structure: [Provocative Question/Statement] + [Unique Value/Insight] + [Strong CTA].
   - Must be between 140-160 characters. No fluff.
3. TONE: Authoritative yet energetic. Speak directly to the "Hardcore Fan" persona.
4. KEYWORDS: Focus on semantic relevance (LSI keywords) that fans actually search for (e.g., "records", "historic moments", "player stats").

Output STRICTLY valid JSON. No conversational filler. No markdown wrappers.`;

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

        const prompt = `You are an elite SEO copywriter specializing in high-stakes sports trivia and gamified content.
Generate high-conversion SEO metadata for the sports quiz: "${quizTitle}".

${description ? `Quiz Narrative: "${description}"` : ""}

Goal: Design a Title tag and Meta Description that triggers the "Competitor Mindset" in sports fans, maximizing CTR and social shares.

🧾 REQUIRED JSON FORMAT:
{
  "title": "Challenging, keyword-rich title (Max 60 chars)",
  "description": "Compelling, CTA-driven meta description (Max 160 chars).",
  "keywords": ["7-10 competitive keywords including the quiz topic"]
}

📝 CONVERSION GUIDELINES:
1. THE CHALLENGE (Title): Include words like "Quiz", "Trivia", "Test", or "Challenge" early. Use a hook that implies difficulty or exclusivity (e.g., "Only 1% Can Pass", "The Ultimate [Topic] Masterclass").
2. THE PAYOFF (Description): Promise a reward or a feeling of accomplishment. 
   - Framework: [Intriguing Hook] + [What They'll Learn/Prove] + [Urgent CTA].
   - Example: "Think you know [Topic]? Prove it by tackling the most advanced trivia challenge online. Play now and claim your rank!"
   - Must be between 140-160 characters.
3. TONE: Hard-hitting, competitive, and respectful of deep-cut sports knowledge.
4. KEYWORDS: Mix head terms with long-tail modifiers (e.g., "[Topic] quiz with answers", "difficult [Topic] trivia").

Output STRICTLY valid JSON. No prose. No markdown.`;

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
