import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import {
    determineSportFromTopic,
    fetchSourceMaterial,
    buildPrompt
} from "@/lib/services/ai-quiz-processor.service";
import { getAIQuizPrompt } from "@/lib/services/settings.service";

// Use Node.js runtime
export const runtime = 'nodejs';

const previewPromptSchema = z
    .object({
        topic: z.string().min(1).optional(),
        customTitle: z.string().min(1).optional(),
        sport: z.string().optional(),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
        numQuestions: z.number().int().min(1).max(50),
        sourceUrl: z.string().url().optional(),
    })
    .superRefine((data, ctx) => {
        if (!data.topic && !data.customTitle && !data.sourceUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["topic"],
                message: "Provide a topic, custom title, or source URL for prompt preview.",
            });
        }
    });

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { topic, customTitle, sport, difficulty, numQuestions, sourceUrl } =
            previewPromptSchema.parse(body);

        const normalizedSport = sport?.trim() || undefined;
        let effectiveTopic = (customTitle || topic || "").trim();

        let sourceMaterial = null;
        if (sourceUrl) {
            sourceMaterial = await fetchSourceMaterial(sourceUrl);
            if (!effectiveTopic && sourceMaterial?.derivedTopic) {
                effectiveTopic = sourceMaterial.derivedTopic;
            }
        }

        if (!effectiveTopic) {
            throw new BadRequestError(
                "Unable to determine a topic. Please provide a topic, custom title, or a descriptive source URL."
            );
        }

        // Determine sport from topic or use provided
        const derivedSportContext = `${effectiveTopic} ${sourceMaterial?.contentSnippet ?? ""}`;
        const quizSport = normalizedSport || determineSportFromTopic(derivedSportContext);

        // Get the prompt template
        const promptTemplate = await getAIQuizPrompt();

        // Create slugified version of topic
        const slugifiedTopic = effectiveTopic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        // Build the prompt
        const prompt = buildPrompt(
            promptTemplate,
            effectiveTopic,
            quizSport,
            difficulty,
            numQuestions,
            slugifiedTopic,
            {
                customTitle: customTitle?.trim(),
                sourceMaterial: sourceMaterial ? {
                    url: sourceMaterial.url,
                    title: sourceMaterial.title,
                    contentSnippet: sourceMaterial.contentSnippet,
                    derivedTopic: sourceMaterial.derivedTopic,
                } : null,
            }
        );

        return successResponse({
            prompt,
            metadata: {
                topic: effectiveTopic,
                sport: quizSport,
                difficulty,
                numQuestions,
            }
        });
    } catch (error) {
        return handleError(error);
    }
}
