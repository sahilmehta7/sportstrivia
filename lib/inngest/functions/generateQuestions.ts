import { inngest } from "@/lib/inngest/client";
import { markBackgroundTaskFailed, markBackgroundTaskInProgress, markBackgroundTaskCompleted, updateBackgroundTask } from "@/lib/services/background-task.service";
import { prisma } from "@/lib/db";
import { BackgroundTaskType } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { getAIModel, getAIQuizPrompt } from "@/lib/services/settings.service";
import { callOpenAIWithRetry, extractContentFromCompletion, extractUsageStats } from "@/lib/services/ai-openai-client.service";
import { extractJSON } from "@/lib/services/ai-quiz-processor.service";

// Helper to rebuild the prompt (copied from route logic)
function buildQuestionsOnlyPrompt(
    baseTemplate: string,
    topicName: string,
    sport: string,
    total: number,
    slug: string,
    counts: { easyCount: number; mediumCount: number; hardCount: number }
): string {
    const scaffold = baseTemplate
        .replace(/\{\{TOPIC\}\}/g, topicName)
        .replace(/\{\{TOPIC_LOWER\}\}/g, topicName.toLowerCase())
        .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slug)
        .replace(/\{\{SPORT\}\}/g, sport)
        .replace(/\{\{DIFFICULTY\}\}/g, "MEDIUM")
        .replace(/\{\{NUM_QUESTIONS\}\}/g, String(total))
        .replace(/\{\{DURATION\}\}/g, String(total * 60));

    const mixNote = `Generate exactly ${counts.easyCount} EASY, ${counts.mediumCount} MEDIUM, and ${counts.hardCount} HARD questions.`;

    return `You are generating questions only. Ignore any quiz-level fields in previous instructions.

Return strictly valid JSON matching this shape and nothing else:
{
  "questions": [
    {
      "questionText": "",
      "difficulty": "EASY|MEDIUM|HARD",
      "hint": "",
      "explanation": "",
      "answers": [
        { "answerText": "", "isCorrect": true },
        { "answerText": "", "isCorrect": false },
        { "answerText": "", "isCorrect": false },
        { "answerText": "", "isCorrect": false }
      ]
    }
  ]
}

Topic: ${topicName}
${mixNote}
All questions must be unique, unambiguous, and about the topic. Ensure factual accuracy. Keep hints short and helpful. Explanations should be 1–2 concise sentences. Only one answer can be correct. Output JSON only.

Context (for your reference):\n\n"""\n${scaffold.substring(0, 1200)}\n"""`;
}

export const generateQuestions = inngest.createFunction(
    { id: "generate-questions" },
    { event: "ai/questions.generate" },
    async ({ event, step }) => {
        const { taskId, topicId, easyCount, mediumCount, hardCount } = event.data;

        try {
            await step.run("mark-in-progress", async () => {
                await markBackgroundTaskInProgress(taskId);
            });

            // 1. Fetch dependencies (Topic, Settings)
            const { topic, aiModel, baseTemplate } = await step.run("fetch-context", async () => {
                const topic = await prisma.topic.findUnique({ where: { id: topicId } });
                if (!topic) throw new NotFoundError("Topic not found");

                const aiModel = await getAIModel();
                const baseTemplate = await getAIQuizPrompt();
                return { topic, aiModel, baseTemplate };
            });

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
            const { completion, generatedContent, usageStats } = await step.run("call-ai", async () => {
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

                return { completion, generatedContent, usageStats };
            });

            // 4. Parse & Process Results
            const resultPayload = await step.run("process-results", async () => {
                const rawResponseData = {
                    rawCompletion: completion,
                    rawGeneratedContent: generatedContent,
                    prompt: prompt.substring(0, 5000),
                };

                const cleanedContent = extractJSON(generatedContent);
                let parsed: any;

                try {
                    parsed = JSON.parse(cleanedContent);
                } catch (error: any) {
                    // Save error state to DB but rethrow to handle in outer catch or final failure
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
                return payload;
            });

            return { taskId, status: "completed", questionCount: resultPayload.questions.length };

        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            await step.run("mark-failed", async () => {
                await markBackgroundTaskFailed(taskId, message);
            });
            throw error;
        }
    }
);
