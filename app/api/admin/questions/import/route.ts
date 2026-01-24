import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { questionsImportSchema } from "@/lib/validations/question.schema";
import { handleError, successResponse } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { Prisma, QuestionType, Difficulty } from "@prisma/client";

export const runtime = 'nodejs';
export const maxDuration = 60; // seconds

/**
 * Normalize difficulty values to uppercase for case-insensitive input
 */
function normalizeDifficulty(value: string | undefined): Difficulty {
    if (!value) return Difficulty.MEDIUM;
    const normalized = value.toUpperCase();
    if (['EASY', 'MEDIUM', 'HARD'].includes(normalized)) {
        return normalized as Difficulty;
    }
    return Difficulty.MEDIUM;
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();

        // Pre-processing to normalize difficulties if they are strings
        const normalizedBody = Array.isArray(body)
            ? body.map((q: any) => ({
                ...q,
                difficulty: typeof q.difficulty === 'string' ? normalizeDifficulty(q.difficulty) : q.difficulty
            }))
            : body;

        // Validate the input
        const parseResult = questionsImportSchema.safeParse(normalizedBody);
        if (!parseResult.success) {
            return new Response(
                JSON.stringify({ error: "Invalid input", details: parseResult.error.format() }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const questionsData = parseResult.data;

        const result = await prisma.$transaction(async (tx) => {
            // Get default topic
            let defaultTopic = await tx.topic.findFirst({
                where: { slug: "general" },
            });

            if (!defaultTopic) {
                defaultTopic = await tx.topic.create({
                    data: {
                        name: "General",
                        slug: "general",
                        description: "General questions",
                        level: 0,
                    },
                });
            }

            // Resolve all topics
            const topicNames = new Set<string>();
            questionsData.forEach(q => {
                if (q.topic) topicNames.add(q.topic.trim());
            });

            const topicMap = new Map<string, string>(); // name -> id
            topicMap.set("General", defaultTopic.id);

            for (const name of topicNames) {
                if (name.toLowerCase() === "general") continue;

                let topic = await tx.topic.findFirst({
                    where: { name: { equals: name, mode: 'insensitive' } }
                });

                if (!topic) {
                    topic = await tx.topic.create({
                        data: {
                            name,
                            slug: await generateUniqueSlug(name, "topic"),
                            level: 0
                        }
                    });
                }
                topicMap.set(name, topic.id);
                topicMap.set(name.toLowerCase(), topic.id);
            }

            // Create questions in batches
            const BATCH_SIZE = 20;
            let importedCount = 0;

            for (let i = 0; i < questionsData.length; i += BATCH_SIZE) {
                const batch = questionsData.slice(i, i + BATCH_SIZE);

                await Promise.all(
                    batch.map(async (q) => {
                        const topicId = q.topic ? (topicMap.get(q.topic.trim()) || topicMap.get(q.topic.trim().toLowerCase()) || defaultTopic!.id) : defaultTopic!.id;

                        await tx.question.create({
                            data: {
                                questionText: q.text,
                                type: q.type as QuestionType,
                                difficulty: q.difficulty as Difficulty,
                                topicId,
                                hint: q.hint,
                                explanation: q.explanation,
                                answers: {
                                    create: q.answers.map((a, idx) => ({
                                        answerText: a.text,
                                        isCorrect: a.isCorrect,
                                        answerImageUrl: a.imageUrl,
                                        displayOrder: idx
                                    }))
                                }
                            }
                        });
                        importedCount++;
                    })
                );
            }

            return { importedCount };
        }, {
            maxWait: 30000,
            timeout: 60000,
        });

        return successResponse({
            message: `Successfully imported ${result.importedCount} questions.`,
            count: result.importedCount
        }, 201);

    } catch (error) {
        return handleError(error);
    }
}
