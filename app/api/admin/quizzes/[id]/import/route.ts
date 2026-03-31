import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { questionsImportSchema } from "@/lib/validations/quiz.schema";
import { handleError, successResponse, NotFoundError } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import {  Difficulty, QuestionType } from "@prisma/client";
import { syncTopicsFromQuestionPool } from "@/lib/services/quiz-topic-sync.service";

export const runtime = 'nodejs';
export const maxDuration = 60; // seconds

// POST /api/admin/quizzes/[id]/import - Import questions into an existing quiz
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quizId } = await params;
        await requireAdmin();

        const body = await request.json();
        console.log('DEBUG: Import Route Body:', JSON.stringify(body, null, 2));

        // Validate the input - difficulty normalization happens in the schema
        const validationResult = questionsImportSchema.safeParse(body);
        if (!validationResult.success) {
            console.error('DEBUG: Import Route Validation Failed:', JSON.stringify(validationResult.error, null, 2));
            throw validationResult.error;
        }
        const { questions } = validationResult.data;

        // Check if quiz exists
        const existingQuiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                _count: {
                    select: { questionPool: true }
                }
            }
        });

        if (!existingQuiz) {
            throw new NotFoundError("Quiz not found");
        }

        // Start transaction
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
                        schemaSameAs: [],
                        alternateNames: [],
                        seoKeywords: []
                    },
                });
            }

            // Resolve topics
            const topicUsageMap = new Map<string, string>(); // normalized name -> original name
            const normalizeTopicName = (name: string) => name.trim().toLowerCase();

            for (const q of questions) {
                const topicName = q.topic?.trim() || "General";
                topicUsageMap.set(normalizeTopicName(topicName), topicName);
            }

            const topicNameMap = new Map<string, string>(); // normalized name -> topicId
            const normalizedNames = Array.from(topicUsageMap.keys());

            // Fetch existing topics
            const existingTopics = await tx.topic.findMany({
                where: {
                    OR: normalizedNames.map((normalized) => ({
                        name: {
                            equals: topicUsageMap.get(normalized)!,
                            mode: "insensitive" as const,
                        },
                    })),
                },
            });

            for (const topic of existingTopics) {
                topicNameMap.set(normalizeTopicName(topic.name), topic.id);
            }

            // Create missing topics
            for (const normalizedName of normalizedNames) {
                if (topicNameMap.has(normalizedName)) continue;

                const topicName = topicUsageMap.get(normalizedName)!;
                const slug = await generateUniqueSlug(topicName, "topic");
                const newTopic = await tx.topic.create({
                    data: {
                        name: topicName,
                        slug,
                        level: 0,
                        schemaSameAs: [],
                        alternateNames: [],
                        seoKeywords: []
                    },
                });
                topicNameMap.set(normalizedName, newTopic.id);
            }

            // Create questions and pool entries
            const BATCH_SIZE = 20;
            let createdCount = 0;
            const currentPoolCount = existingQuiz._count.questionPool;

            for (let i = 0; i < questions.length; i += BATCH_SIZE) {
                const batch = questions.slice(i, i + BATCH_SIZE);
                await Promise.all(
                    batch.map(async (qData, idx) => {
                        const topicId = topicNameMap.get(normalizeTopicName(qData.topic || "General")) || defaultTopic!.id;

                        const question = await tx.question.create({
                            data: {
                                questionText: qData.text,
                                type: (qData.type?.toUpperCase() || "MULTIPLE_CHOICE") as QuestionType,
                                difficulty: qData.difficulty as Difficulty,
                                topicId,
                                hint: qData.hint,
                                explanation: qData.explanation,
                                answers: {
                                    create: qData.answers.map((a, aIdx) => ({
                                        answerText: a.text,
                                        isCorrect: a.isCorrect,
                                        answerImageUrl: a.imageUrl,
                                        displayOrder: aIdx,
                                    })),
                                },
                            },
                        });

                        const order = qData.order ?? (currentPoolCount + i + idx + 1);

                        await tx.quizQuestionPool.create({
                            data: {
                                quizId: quizId,
                                questionId: question.id,
                                order,
                                points: 1,
                            },
                        });

                        createdCount++;
                    })
                );
            }

            return { count: createdCount };
        }, {
            maxWait: 30000,
            timeout: 60000,
        });

        // Sync topic configurations after transaction completes
        await syncTopicsFromQuestionPool(quizId);

        return successResponse({
            message: `Successfully imported ${result.count} questions into the quiz.`,
            importedCount: result.count,
        }, 201);

    } catch (error) {
        return handleError(error);
    }
}
