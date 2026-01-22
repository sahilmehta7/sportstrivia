import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured, QUIZ_IMAGES_BUCKET } from "@/lib/supabase";
import { optimizeImage } from "@/lib/image-optimization";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI image generation (can take 30-60 seconds)
export const maxDuration = 60; // seconds

const INSTRUCTION_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image"; // Nano Banana
const MAX_SIZE_BYTES = 400 * 1024; // 400 KB
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 720;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestError("Gemini API key is not configured");
    }

    if (!isSupabaseConfigured()) {
      throw new BadRequestError("Supabase storage is not configured");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        topicConfigs: {
          select: {
            topic: {
              select: {
                name: true,
              },
            },
          },
        },
        questionPool: {
          select: {
            question: {
              select: {
                topic: {
                  select: { name: true }
                }
              },
            },
          },
          take: 5,
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz not found");
    }

    const topics = new Set<string>();
    quiz.topicConfigs.forEach((config) => {
      if (config.topic?.name) {
        topics.add(config.topic.name);
      }
    });
    quiz.questionPool.forEach((item) => {
      const topicName = item.question.topic?.name;
      if (topicName) {
        topics.add(topicName);
      }
    });

    const instructionPrompt = `You are an art director crafting prompts for image generators. Write a concise, vivid description (max 280 characters) for a sports quiz cover image with no text or logos.
Quiz title: ${quiz.title || "Untitled Sports Quiz"}
Quiz description: ${quiz.description || "(none)"}
Key topics: ${Array.from(topics).join(", ") || "general sports"}
Tone: energetic, competitive, modern broadcast graphics.
Mention relevant colors, action, and setting. Reply with description only.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: INSTRUCTION_MODEL });

    const instructionResult = await model.generateContent(instructionPrompt);
    const generatedInstruction = instructionResult.response.text().trim();

    if (!generatedInstruction) {
      throw new BadRequestError("Prompt generation did not return any content");
    }

    // Generate Image using Gemini 2.5 Flash Image (Nano Banana)
    let imageBuffer: Buffer | null = null;
    let lastError: any = null;

    try {
      console.log(`Attempting image generation with ${IMAGE_MODEL} for prompt: ${generatedInstruction}...`);
      const imageModel = genAI.getGenerativeModel({ model: IMAGE_MODEL });

      const result = await imageModel.generateContent(generatedInstruction);
      const response = await result.response;

      // @ts-ignore - The SDK types might not strictly guarantee inlineData presence in all versions yet
      const parts = response.candidates?.[0]?.content?.parts;

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            break;
          }
        }
      }

      if (!imageBuffer) {
        // Fallback/Check for refusal or other issues
        console.warn("No inline data found in response:", JSON.stringify(response, null, 2));
        throw new Error("Model generated a response but no image data was found.");
      }

    } catch (error: any) {
      console.error(`${IMAGE_MODEL} failed:`, error);
      lastError = error;

      // Improve error message for known issues
      if (error.message?.includes("429") || error.message?.includes("quota")) {
        throw new BadRequestError(`Gemini Image API Quota Exceeded: ${error.message} (Please check your Google AI Studio billing/quota settings for ${IMAGE_MODEL})`);
      }

      throw new BadRequestError(
        `Gemini Image API error: ${error.message}`
      );
    }

    if (!imageBuffer) {
      throw new BadRequestError("Failed to generate image buffer");
    }

    const optimized = await optimizeImage(imageBuffer, {
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      fit: 'cover',
      maxSizeBytes: MAX_SIZE_BYTES
    });

    const supabase = getSupabaseClient();
    const filePath = `quizzes/${id}/ai-cover-${Date.now()}.webp`;

    // Upload with retry logic for reliability
    let uploadAttempts = 0;
    let uploadError: any = null;
    const MAX_UPLOAD_RETRIES = 3;

    while (uploadAttempts < MAX_UPLOAD_RETRIES) {
      const { error } = await supabase.storage
        .from(QUIZ_IMAGES_BUCKET)
        .upload(filePath, optimized, {
          contentType: "image/webp",
          upsert: true,
        });

      if (!error) {
        uploadError = null;
        break;
      }

      uploadError = error;
      uploadAttempts++;

      if (uploadAttempts < MAX_UPLOAD_RETRIES) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new BadRequestError(
        uploadError.message || "Failed to upload image to storage after multiple attempts"
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(QUIZ_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;

    if (!imageUrl) {
      throw new BadRequestError("Unable to retrieve public URL for uploaded image");
    }

    await prisma.quiz.update({
      where: { id },
      data: {
        descriptionImageUrl: imageUrl,
      },
    });

    return successResponse({ url: imageUrl });
  } catch (error) {
    return handleError(error);
  }
}
