import { markBackgroundTaskFailed, markBackgroundTaskInProgress, markBackgroundTaskCompleted, updateBackgroundTask } from "@/lib/services/background-task.service";
import { prisma } from "@/lib/db";
import { BackgroundTaskType } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { getAIModel, getAIQuizPrompt } from "@/lib/services/settings.service";
import { callOpenAIWithRetry, extractContentFromCompletion, extractUsageStats } from "@/lib/services/ai-openai-client.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";

interface GenerateQuestionsInput {
    topicId: string;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

// Helper to rebuild the prompt (copied from route logic)
function buildQuestionsOnlyPrompt(
    baseTemplate: string,
    topicName: string,
    sport: string,
    total: number,
    slug: string,
    counts: { easyCount: number; mediumCount: number; hardCount: number }
): string {
    const mixNote = `Generate exactly ${counts.easyCount} EASY, ${counts.mediumCount} MEDIUM, and ${counts.hardCount} HARD questions.`;

    return `You are an elite sports trivia architect focusing on "${topicName}" (${sport}).

Goal: Generate a batch of high-quality, standalone trivia questions.

🧾 Required JSON Shape:
{
  "questions": [
    {
      "questionText": "The specific question text. Must be factually accurate and unambiguous.",
      "difficulty": "EASY|MEDIUM|HARD",
      "hint": "A helpful but non-obvious clue.",
      "explanation": "A fascinating 'Did you know?' style fact related to the answer (1-2 sentences).",
      "answers": [
        { "answerText": "Correct Answer", "isCorrect": true },
        { "answerText": "Plausible Distractor 1", "isCorrect": false },
        { "answerText": "Plausible Distractor 2", "isCorrect": false },
        { "answerText": "Plausible Distractor 3", "isCorrect": false }
      ]
    }
  ]
}

📝 Quality Benchmarks:
1. Topic Focus: All questions must be strictly about ${topicName}.
2. Distribution: ${mixNote}
3. Diversity: Include a mix of career milestones, historical records, and unique trivia nuggets.
4. Distractors: Ensure wrong answers are plausible and professionally formatted.
5. Accuracy: All data must be verified.
6. Format: Output strictly valid JSON. No conversational filler or markdown wrappers.

Context (for tone and style reference):
"""
${baseTemplate.substring(0, 1000)}
"""`;
}

export async function processAIQuestionsTask(taskId: string): Promise<void> {
    try {
        await markBackgroundTaskInProgress(taskId);

        // Get task from database
        const task = await prisma.adminBackgroundTask.findUnique({ where: { id: taskId } });
        if (!task || !task.input) throw new Error("Task not found or missing input");

        const { topicId, easyCount, mediumCount, hardCount } = task.input as unknown as GenerateQuestionsInput;

        // 1. Fetch dependencies (Topic, Settings)
        const topic = await prisma.topic.findUnique({ where: { id: topicId } });
        if (!topic) throw new NotFoundError("Topic not found");

        const aiModel = await getAIModel();
        const baseTemplate = await getAIQuizPrompt();

        // 2. Build Prompt
        const total = easyCount + mediumCount + hardCount;
        const slugifiedTopic = topic.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        const prompt = buildQuestionsOnlyPrompt(
            baseTemplate,
            topic.name,
            topic.level === 0 ? topic.name : topic.name, // Simplified logic
            total,
            slugifiedTopic,
            { easyCount, mediumCount, hardCount }
        );

        // 3. Call AI
        const isO1 = aiModel.startsWith("o1");
        let systemMessage = "You are an expert sports quiz creator. You create engaging, accurate questions in strict JSON format.";
        if (isO1) {
            systemMessage = "You are an expert sports quiz creator. CRITICAL: Output ONLY valid JSON. No markdown or extra text.";
        }

        const completion = await callOpenAIWithRetry(
            aiModel,
            prompt,
            systemMessage,
            {
                temperature: 0.8,
                maxTokens: isO1 ? 16000 : 4000,
                responseFormat: isO1 ? null : { type: "json_object" },
            }
        );

        const generatedContent = extractContentFromCompletion(completion, aiModel);
        const usageStats = extractUsageStats(completion);

        const rawResponseData = {
            rawCompletion: completion,
            rawGeneratedContent: generatedContent,
            prompt: prompt.substring(0, 5000),
        };

        // 4. Parse & Process Results
        const cleanedContent = extractJSON(generatedContent);
        let parsed: any;

        try {
            parsed = JSON.parse(cleanedContent);
        } catch (error: any) {
            // Save error state to DB but rethrow
            await updateBackgroundTask(taskId, {
                result: {
                    rawResponse: rawResponseData,
                    parseError: {
                        message: error.message,
                        cleanedContent: cleanedContent.substring(0, 2000),
                    },
                    canRetryParsing: true,
                }
            });
            throw new Error("Failed to parse JSON content from AI");
        }

        const questionsRaw: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
        if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
            throw new Error("No questions found in AI output");
        }

        const normalized = questionsRaw.map((q: any) => ({
            questionText: q.questionText || q.text || "",
            difficulty: String(q.difficulty || "MEDIUM").toUpperCase(),
            hint: q.hint || undefined,
            explanation: q.explanation || undefined,
            answers: (Array.isArray(q.answers) ? q.answers : []).map((a: any, i: number) => ({
                answerText: a.answerText || a.text || "",
                isCorrect: Boolean(a.isCorrect),
                displayOrder: i,
                answerImageUrl: "",
                answerVideoUrl: "",
                answerAudioUrl: "",
            })),
        }));

        const payload = {
            topicId,
            topicName: topic.name,
            model: aiModel,
            api: usageStats.api,
            requested: { easyCount, mediumCount, hardCount, total },
            questions: normalized,
            tokensUsed: usageStats.tokensUsed,
            promptPreview: `${prompt.substring(0, 200)}...`,
            rawResponse: rawResponseData,
            canRetryParsing: true,
        };

        await markBackgroundTaskCompleted(taskId, payload);

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await markBackgroundTaskFailed(taskId, message);
        throw error;
    }
}
