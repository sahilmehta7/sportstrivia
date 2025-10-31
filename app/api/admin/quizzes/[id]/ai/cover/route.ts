import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured, QUIZ_IMAGES_BUCKET } from "@/lib/supabase";
import sharp from "sharp";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI image generation (can take 30-60 seconds)
export const maxDuration = 60; // seconds

const INSTRUCTION_MODEL = "gpt-4o";
const IMAGE_MODEL = "dall-e-3";
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

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError("OpenAI API key is not configured");
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

    const instructionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: INSTRUCTION_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You craft concise, imaginative prompts for image generation. Avoid mentioning text, typography, or words in the image. No markdown—plain text only.",
          },
          {
            role: "user",
            content: instructionPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!instructionResponse.ok) {
      const error = await instructionResponse.json().catch(() => ({}));
      throw new BadRequestError(
        `OpenAI prompt generation error: ${error.error?.message || instructionResponse.statusText}`
      );
    }

    const instructionCompletion = await instructionResponse.json();
    const generatedInstruction = instructionCompletion.choices?.[0]?.message?.content?.trim();

    if (!generatedInstruction) {
      throw new BadRequestError("Prompt generation did not return any content");
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: generatedInstruction,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new BadRequestError(
        `OpenAI image API error: ${error.error?.message || response.statusText}`
      );
    }

    const result = await response.json();
    const imageData = result.data?.[0];

    if (!imageData) {
      throw new BadRequestError("OpenAI did not return image data");
    }

    let imageBuffer: Buffer;

    if (imageData.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      const imageResp = await fetch(imageData.url);
      if (!imageResp.ok) {
        throw new BadRequestError("Failed to download generated image");
      }
      const arrayBuffer = await imageResp.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new BadRequestError("Unsupported image response format from OpenAI");
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
