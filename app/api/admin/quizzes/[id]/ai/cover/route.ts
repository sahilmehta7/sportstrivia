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

const INSTRUCTION_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "imagen-4.0-generate-001"; // Upgraded to Imagen 4
const IMAGE_MODEL_FAST = "imagen-4.0-fast-generate-001"; // Fallback model
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

    // Generate Image using Imagen 3/4 model via Gemini API
    // Fallback logic: Try Standard -> Fallback to Fast

    let imageBuffer: Buffer | null = null;
    let lastError: any = null;

    const generateImage = async (modelName: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${process.env.GEMINI_API_KEY}`, {
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

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || response.statusText);
      }

      const result = await response.json();
      const base64Image = result.predictions?.[0]?.bytesBase64Encoded;

      if (!base64Image) {
        throw new Error("Gemini/Imagen did not return image data");
      }
      return Buffer.from(base64Image, "base64");
    };

    try {
      console.log(`Attempting image generation with ${IMAGE_MODEL}...`);
      imageBuffer = await generateImage(IMAGE_MODEL);
    } catch (error) {
      console.warn(`${IMAGE_MODEL} failed, retrying with ${IMAGE_MODEL_FAST}:`, error);
      lastError = error;
      try {
        console.log(`Attempting image generation with ${IMAGE_MODEL_FAST}...`);
        imageBuffer = await generateImage(IMAGE_MODEL_FAST);
      } catch (fastError) {
        console.error(`${IMAGE_MODEL_FAST} also failed:`, fastError);
        throw new BadRequestError(
          `Gemini Image API error (Standard & Fast models failed). Last error: ${fastError instanceof Error ? fastError.message : String(fastError)}`
        );
      }
    }

    if (!imageBuffer) {
      throw new BadRequestError("Failed to generate image buffer");
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
