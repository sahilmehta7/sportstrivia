import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getAIModel } from "@/lib/services/settings.service";
import {
    callOpenAIWithRetry,
    extractContentFromCompletion,
} from "@/lib/services/ai-openai-client.service";

// Use Node.js runtime for AI operations
export const runtime = 'nodejs';
export const maxDuration = 60;

const questionFixSchema = z.object({
    questionText: z.string().min(1, "Question text is required"),
    answers: z.array(z.object({
        answerText: z.string(),
        isCorrect: z.boolean(),
    })).min(2, "At least 2 answers required"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    hint: z.string().optional(),
    explanation: z.string().optional(),
    topicName: z.string().optional(),
});

const SYSTEM_MESSAGE = `You are an expert sports trivia editor. Your job is to improve quiz questions to make them more engaging, accurate, and interesting while maintaining factual correctness.

When improving a question:
1. Make the question text clearer and more engaging
2. Ensure all answer options are plausible (avoid obviously wrong answers)
3. Keep the correct answer accurate
4. Add or improve hints if applicable
5. Add or improve explanations to help users learn
6. Maintain the original difficulty level
7. Keep the sports trivia focus

Always respond with valid JSON matching this exact structure:
{
  "questionText": "Improved question text",
  "answers": [
    { "answerText": "Answer A", "isCorrect": true/false },
    { "answerText": "Answer B", "isCorrect": true/false },
    { "answerText": "Answer C", "isCorrect": true/false },
    { "answerText": "Answer D", "isCorrect": true/false }
  ],
  "hint": "Optional helpful hint",
  "explanation": "Educational explanation of the correct answer"
}

Ensure exactly one answer is marked as correct.`;

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        if (!process.env.OPENAI_API_KEY) {
            throw new BadRequestError(
                "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables."
            );
        }

        const body = await request.json();
        const { questionText, answers, difficulty, hint, explanation, topicName } = questionFixSchema.parse(body);

        // Find the correct answer for context
        const correctAnswer = answers.find(a => a.isCorrect);

        // Build the prompt
        const prompt = `Please improve this sports trivia question:

**Question:** ${questionText}

**Answers:**
${answers.map((a, i) => `${String.fromCharCode(65 + i)}. ${a.answerText}${a.isCorrect ? ' (CORRECT)' : ''}`).join('\n')}

${difficulty ? `**Difficulty:** ${difficulty}` : ''}
${topicName ? `**Topic:** ${topicName}` : ''}
${hint ? `**Current Hint:** ${hint}` : ''}
${explanation ? `**Current Explanation:** ${explanation}` : ''}

Make this question more engaging and interesting while keeping the correct answer as: "${correctAnswer?.answerText || 'the marked correct answer'}"

Return the improved version as JSON.`;

        // Get configured AI model
        const aiModel = await getAIModel();
        console.log(`[AI Question Fix] Using model: ${aiModel}`);

        // Call OpenAI
        const completion = await callOpenAIWithRetry(
            aiModel,
            prompt,
            SYSTEM_MESSAGE,
            {
                temperature: 0.7,
                maxTokens: 1000,
                responseFormat: { type: "json_object" },
            }
        );

        // Extract content from response
        const content = extractContentFromCompletion(completion, aiModel);

        if (!content) {
            throw new BadRequestError("OpenAI response did not contain any content");
        }

        // Parse the JSON response
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseError: any) {
            console.error("[AI Question Fix] Failed to parse response:", content);
            throw new BadRequestError(
                `Failed to parse AI response as JSON. Error: ${parseError.message}`
            );
        }

        // Validate the response structure
        if (!parsed.questionText || !Array.isArray(parsed.answers)) {
            throw new BadRequestError(
                "AI response is missing required fields (questionText or answers)"
            );
        }

        // Ensure exactly one correct answer
        const correctCount = parsed.answers.filter((a: any) => a.isCorrect).length;
        if (correctCount !== 1) {
            // Try to fix it - keep the original correct answer
            const originalCorrectIndex = answers.findIndex(a => a.isCorrect);
            if (originalCorrectIndex >= 0 && originalCorrectIndex < parsed.answers.length) {
                parsed.answers.forEach((a: any, i: number) => {
                    a.isCorrect = i === originalCorrectIndex;
                });
            } else {
                // Default to first answer
                parsed.answers.forEach((a: any, i: number) => {
                    a.isCorrect = i === 0;
                });
            }
        }

        return successResponse({
            questionText: parsed.questionText,
            answers: parsed.answers.map((a: any, i: number) => ({
                answerText: a.answerText || "",
                isCorrect: Boolean(a.isCorrect),
                displayOrder: i,
            })),
            hint: parsed.hint || "",
            explanation: parsed.explanation || "",
        });
    } catch (error) {
        return handleError(error);
    }
}
