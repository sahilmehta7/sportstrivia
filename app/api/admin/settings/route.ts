import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import {
  getAIQuizPrompt,
  updateAIQuizPrompt,
  resetAIQuizPrompt,
  getAIModel,
  updateAIModel,
  DEFAULT_AI_QUIZ_PROMPT,
  DEFAULT_AI_MODEL,
  AVAILABLE_AI_MODELS,
} from "@/lib/services/settings.service";

const updateSettingSchema = z.object({
  key: z.enum(["ai_quiz_prompt", "ai_model"]),
  value: z.string().min(1),
});

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key === "ai_quiz_prompt") {
      const prompt = await getAIQuizPrompt();
      
      // Also check if value is stored in database
      let storedInDb = false;
      try {
        const dbSetting = await prisma.appSettings.findUnique({
          where: { key: "ai_quiz_prompt" },
        });
        storedInDb = !!dbSetting;
      } catch {
        // Table might not exist
        storedInDb = false;
      }
      
      return successResponse({
        key: "ai_quiz_prompt",
        value: prompt,
        isDefault: prompt === DEFAULT_AI_QUIZ_PROMPT,
        storedInDatabase: storedInDb,
      });
    }

    if (key === "ai_model") {
      const model = await getAIModel();
      
      // Check if stored in database
      let storedInDb = false;
      try {
        const dbSetting = await prisma.appSettings.findUnique({
          where: { key: "ai_model" },
        });
        storedInDb = !!dbSetting;
      } catch {
        storedInDb = false;
      }
      
      return successResponse({
        key: "ai_model",
        value: model,
        isDefault: model === DEFAULT_AI_MODEL,
        storedInDatabase: storedInDb,
        availableModels: AVAILABLE_AI_MODELS,
      });
    }

    // Return all settings
    const aiPrompt = await getAIQuizPrompt();
    const aiModel = await getAIModel();
    
    return successResponse({
      settings: [
        {
          key: "ai_quiz_prompt",
          value: aiPrompt,
          isDefault: aiPrompt === DEFAULT_AI_QUIZ_PROMPT,
          category: "ai",
          label: "AI Quiz Generator Prompt",
          description: "Template used for generating quizzes with AI",
        },
        {
          key: "ai_model",
          value: aiModel,
          isDefault: aiModel === DEFAULT_AI_MODEL,
          category: "ai",
          label: "AI Model",
          description: "OpenAI model used for quiz generation",
          availableModels: AVAILABLE_AI_MODELS,
        },
      ],
    });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/settings - Update a setting
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const body = await request.json();
    const { key, value } = updateSettingSchema.parse(body);

    if (key === "ai_quiz_prompt") {
      await updateAIQuizPrompt(value, user.id);
    } else if (key === "ai_model") {
      await updateAIModel(value, user.id);
    }

    return successResponse({
      message: "Setting updated successfully",
      key,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/settings - Reset a setting to default
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      throw new BadRequestError("Setting key is required");
    }

    if (key === "ai_quiz_prompt") {
      await resetAIQuizPrompt();
    }

    return successResponse({
      message: "Setting reset to default",
      key,
    });
  } catch (error) {
    return handleError(error);
  }
}

