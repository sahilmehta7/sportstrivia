import { prisma } from "@/lib/db";

// Default AI Quiz Generator Prompt Template
export const DEFAULT_AI_QUIZ_PROMPT = `You are an expert sports quiz creator. Create a quiz in strict JSON format with the following structure.

Use the topic "{{TOPIC}}" for all questions.
The quiz should have {{NUM_QUESTIONS}} questions.
The overall difficulty of the quiz should be {{DIFFICULTY}}.
Each question should still include a variety of easy, medium, and hard difficulties unless stated otherwise.
Provide a hint and an explanation for every question.
Do not include IDs in the output.
Output strictly valid JSON — no extra text or markdown.

🧾 Required JSON Structure:
{
  "title": "{{TOPIC}} Quiz",
  "description": "Test your knowledge about {{TOPIC}}",
  "slug": "{{SLUGIFIED_TOPIC}}-quiz",
  "sport": "{{SPORT}}",
  "difficulty": "{{DIFFICULTY}}",
  "duration": {{DURATION}},
  "passingScore": 70,
  "seo": {
    "title": "{{TOPIC}} Quiz - Test Your Knowledge",
    "description": "Challenge yourself with questions about {{TOPIC}}.",
    "keywords": ["{{TOPIC_LOWER}}", "quiz", "sports", "trivia"]
  },
  "questions": [
    {
      "text": "Question text goes here",
      "difficulty": "easy",
      "topic": "{{TOPIC}}",
      "hint": "Hint goes here",
      "explanation": "Explanation or fact goes here",
      "answers": [
        { "text": "Correct Answer", "isCorrect": true },
        { "text": "Wrong Answer 1", "isCorrect": false },
        { "text": "Wrong Answer 2", "isCorrect": false },
        { "text": "Wrong Answer 3", "isCorrect": false }
      ]
    }
  ]
}

📝 Instructions:
- All questions must have the topic name "{{TOPIC}}"
- Use a mix of factual, record-based, and contextual questions
- Keep explanations short (1–2 sentences)
- Ensure all answers are plausible but only one is correct
- Make hints helpful but not obvious
- Vary question difficulty (easy, medium, hard) within the quiz
- Output only the JSON, no prose or markdown`;

// Default AI Model
export const DEFAULT_AI_MODEL = "gpt-4o";

// Available AI Models (Updated from https://platform.openai.com/docs/models - Oct 2025)
export const AVAILABLE_AI_MODELS = [
  // GPT-5 Series (Latest Generation - Released Aug 2025) 🆕
  { value: "gpt-5", label: "GPT-5", description: "Latest flagship, enhanced reasoning & multimodal" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Fast, cost-effective GPT-5 variant" },
  { value: "gpt-5-nano", label: "GPT-5 Nano", description: "Ultra-fast, minimal latency" },
  { value: "gpt-5-chat", label: "GPT-5 Chat", description: "Optimized for conversational tasks" },

  // GPT-4o Series (Previous flagship, still excellent)
  { value: "gpt-4o", label: "GPT-4o (Latest)", description: "Recommended - Fast, capable, 128K context" },
  { value: "gpt-4o-2024-11-20", label: "GPT-4o (Nov 2024)", description: "Stable snapshot" },
  { value: "gpt-4o-2024-08-06", label: "GPT-4o (Aug 2024)", description: "Structured outputs support" },
  { value: "gpt-4o-2024-05-13", label: "GPT-4o (May 2024)", description: "Original GPT-4o release" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast, affordable, 128K context" },
  { value: "gpt-4o-mini-2024-07-18", label: "GPT-4o Mini (July 2024)", description: "Mini stable snapshot" },

  // o1 Series (Advanced reasoning - slower, no JSON mode)
  { value: "o1", label: "o1 (Latest)", description: "⚠️ Reasoning model, 200K - May fail JSON parsing" },
  { value: "o1-2024-12-17", label: "o1 (Dec 2024)", description: "⚠️ Reasoning - No JSON mode" },
  { value: "o1-preview", label: "o1 Preview", description: "⚠️ Preview reasoning - No JSON mode" },
  { value: "o1-preview-2024-09-12", label: "o1 Preview (Sept 2024)", description: "⚠️ No JSON mode" },
  { value: "o1-mini", label: "o1 Mini", description: "⚠️ Faster reasoning - No JSON mode" },
  { value: "o1-mini-2024-09-12", label: "o1 Mini (Sept 2024)", description: "⚠️ No JSON mode" },

  // GPT-4 Turbo Series (Previous generation)
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Previous flagship, 128K context" },
  { value: "gpt-4-turbo-2024-04-09", label: "GPT-4 Turbo (Apr 2024)", description: "Turbo snapshot" },
  { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo Preview", description: "Turbo preview" },

  // GPT-4 Series (Legacy - 8K context only)
  { value: "gpt-4", label: "GPT-4", description: "Original GPT-4, 8K context" },
  { value: "gpt-4-0613", label: "GPT-4 (June 2023)", description: "GPT-4 snapshot" },

  // GPT-3.5 Series (Budget option - good for testing)
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Budget-friendly, fast, 16K context" },
  { value: "gpt-3.5-turbo-0125", label: "GPT-3.5 Turbo (Jan 2024)", description: "Latest 3.5 snapshot" },
] as const;

// Settings keys
export const SETTINGS_KEYS = {
  AI_QUIZ_PROMPT: "ai_quiz_prompt",
  AI_MODEL: "ai_model",
} as const;

// Get a setting value
export async function getSetting(key: string): Promise<string | null> {
  try {
    // Check if AppSettings table exists
    if (!prisma.appSettings) {
      console.warn("AppSettings model not available - using defaults");
      return null;
    }

    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error: unknown) {
    // If table doesn't exist (P2021) or other database errors, return null
    const isPrismaError = error instanceof Error && 'code' in error;
    const errorCode = isPrismaError ? (error as { code?: string }).code : undefined;
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorCode === 'P2021' || errorMessage.includes('does not exist')) {
      console.warn("AppSettings table does not exist yet - run 'npx prisma db push'");
      return null;
    }
    console.error("Error fetching setting:", error);
    return null;
  }
}

// Set a setting value
export async function setSetting(
  key: string,
  value: string,
  category: string = "general",
  updatedBy?: string
): Promise<void> {
  try {
    if (!prisma.appSettings) {
      throw new Error("AppSettings table not available. Run 'npx prisma db push' to create the table.");
    }

    await prisma.appSettings.upsert({
      where: { key },
      update: {
        value,
        category,
        updatedBy,
      },
      create: {
        key,
        value,
        category,
        updatedBy,
      },
    });
  } catch (error: unknown) {
    const isPrismaError = error instanceof Error && 'code' in error;
    const errorCode = isPrismaError ? (error as { code?: string }).code : undefined;
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorCode === 'P2021' || errorMessage.includes('does not exist')) {
      throw new Error("AppSettings table does not exist. Please run 'npx prisma db push' to create the table.");
    }
    console.error("Error setting value:", error);
    throw error;
  }
}

// Get AI Quiz Prompt (with fallback to default)
export async function getAIQuizPrompt(): Promise<string> {
  try {
    const customPrompt = await getSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT);
    return customPrompt || DEFAULT_AI_QUIZ_PROMPT;
  } catch {
    // If database error, return default
    return DEFAULT_AI_QUIZ_PROMPT;
  }
}

// Update AI Quiz Prompt
export async function updateAIQuizPrompt(prompt: string, updatedBy?: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT, prompt, "ai", updatedBy);
}

// Reset AI Quiz Prompt to default
export async function resetAIQuizPrompt(): Promise<void> {
  try {
    await prisma.appSettings.delete({
      where: { key: SETTINGS_KEYS.AI_QUIZ_PROMPT },
    });
  } catch {
    // Ignore if doesn't exist
  }
}

// Get AI Model (with fallback to default)
export async function getAIModel(): Promise<string> {
  try {
    const customModel = await getSetting(SETTINGS_KEYS.AI_MODEL);
    return customModel || DEFAULT_AI_MODEL;
  } catch {
    // If database error, return default
    return DEFAULT_AI_MODEL;
  }
}

// Update AI Model
export async function updateAIModel(model: string, updatedBy?: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.AI_MODEL, model, "ai", updatedBy);
}

