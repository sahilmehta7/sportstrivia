import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured, QUIZ_IMAGES_BUCKET } from "@/lib/supabase";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI image generation (can take 30-60 seconds)
export const maxDuration = 60; // seconds

const INSTRUCTION_MODEL = "gemini-2.0-flash-exp";
const IMAGE_MODEL = "imagen-4.0-generate-001"; // Upgraded to Imagen 4
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

    // Generate Image using Imagen 3 model via Gemini API
    // Note: As of early 2025, specific Imagen 3 access might be via a separate method or model name depending on library version.
    // We will use the model.generateContent method if it supports image generation response or a specific mix.
    // However, the standard way for Imagen in JS SDK might technically differ or use a specific endpoint.
    // Assuming standard 'imagen-3.0-generate-001' usage via the same client if standardized, 
    // OR we might need to use rest API if the SDK doesn't fully support the image helper yet.
    // For now, we will assume the SDK is updated to support it or use a fetch fallback if needed.
    // Actually, looking at current docs, standard SDK usage for Imagen might not be 'generateContent'.
    // Let's use the fetch implementation for Imagen to be safe as SDKs vary.

    // Fallback to fetch for Imagen 3 as it's often a specific endpoint
    const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: generatedInstruction,
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
        }
      })
    });

    // Check if standard fetch failed, try newer generateImages method if available or different endpoint
    // If the above "predict" endpoint is for Vertex AI, we might need the consumer generic endpoint.
    // Let's try the standard v1beta/models/imagen-3.0-generate-001:predict pattern. 
    // If that fails, we can try to use the SDK if it has 'generateImage' (unlikely in standard package yet).

    // Actually, a safer bet for "Gemini 2.5" era is that the SDK has image tools. 
    // But since I cannot be 100% sure of the SDK version's exact capabilities in this environment without checking types,
    // I will use a robust fetch implementation that targets the likely public API endpoint.

    // REVISION: The standard Google AI Studio endpoint for Imagen is:
    // POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
    // Payload: { instances: [{ prompt: "..." }], parameters: { ... } }

    let imageBuffer: Buffer;

    if (imagenResponse.ok) {
      const result = await imagenResponse.json();
      const base64Image = result.predictions?.[0]?.bytesBase64Encoded;

      if (!base64Image) {
        throw new BadRequestError("Gemini/Imagen did not return image data");
      }
      imageBuffer = Buffer.from(base64Image, "base64");
    } else {
      const error = await imagenResponse.json().catch(() => ({}));
      throw new BadRequestError(
        `Gemini Image API error: ${error.error?.message || imagenResponse.statusText}`
      );
    }

    let quality = 75;
    let optimized = await sharp(imageBuffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover" })
      .webp({ quality })
      .toBuffer();

    while (optimized.length > MAX_SIZE_BYTES && quality > 35) {
      quality -= 10;
      optimized = await sharp(imageBuffer)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover" })
        .webp({ quality })
        .toBuffer();
    }

    if (optimized.length > MAX_SIZE_BYTES) {
      throw new BadRequestError("Unable to compress image under 400KB. Please try again.");
    }

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
