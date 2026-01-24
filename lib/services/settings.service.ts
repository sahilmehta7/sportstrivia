import { prisma } from "@/lib/db";

// Default AI Quiz Generator Prompt Template
export const DEFAULT_AI_QUIZ_PROMPT = `You are a Senior Producer for a televised sports trivia show and a Lead Sports Historian. Your goal is to create immersive, accurate, story-driven quizzes for "Hardcore Sports Fans".

# ROLE & TONE
- Expert Historian: Value depth, accuracy, and rare, fascinating storylines.
- TV Producer: Ensure every question has high production value and dramatic flair.
- Professional: Use precise terminology (e.g., 'The Open Championship' over 'British Open').
- Engaging: Use an energetic and respectful tone towards the sport's history.

# TV QUALITY PRODUCTION RULES
1. THE HOOK (Cinematic Setup): Start question text with a compelling narrative setup or rare detail (e.g., 'Before becoming a household name...' or 'In a statistical anomaly...').
2. PROFESSIONALISM: Use exact, prestigious sports terminology. Refer to full trophy names and specific event titles.
3. THE 'WHY' (Historical Significance): The explanation MUST explain why the fact is historically significant or how it impacted the sport.
4. INTELLIGENT DISTRACTORS: Options must be plausible 'near-misses' (e.g., runners-up or contemporaries) to challenge true experts.

# CONTEXT
- Topic: "{{TOPIC}}"
- Sport: "{{SPORT}}"
- Target Questions: {{NUM_QUESTIONS}}
- Difficulty Tier: {{DIFFICULTY}}

# JSON SCHEMA REQUIREMENTS
{
  "title": "SEO-optimized title (e.g., 'The Ultimate {{TOPIC}} Challenge')",
  "description": "2-sentence hook making fans want to play.",
  "slug": "{{SLUGIFIED_TOPIC}}-quiz",
  "sport": "{{SPORT}}",
  "difficulty": "{{DIFFICULTY}}",
  "duration": {{DURATION}},
  "passingScore": 70,
  "seo": {
    "title": "Max 60 chars. Optimized: '{{TOPIC}} Trivia Quiz'",
    "description": "Max 160 chars including {{TOPIC}} keywords.",
    "keywords": ["{{TOPIC_LOWER}}", "trivia", "quiz", "sports", "{{SPORT}}"]
  },
  "questions": [
    {
      "text": "Cinematic question starting with a narrative hook. Avoid dry phrasing.",
      "difficulty": "easy | medium | hard",
      "topic": "{{TOPIC}}",
      "hint": "Subtle nudge that adds layers without giving it away.",
      "explanation": "Historically significant 'Why' behind the fact (1-2 sentences).",
      "answers": [
        { "text": "Correct Answer", "isCorrect": true },
        { "text": "Distractor 1", "isCorrect": false },
        { "text": "Distractor 2", "isCorrect": false },
        { "text": "Distractor 3", "isCorrect": false }
      ]
    }
  ]
}

# QUALITY BENCHMARKS
1. DIFFICULTY MIX: Even if tier is {{DIFFICULTY}}, include:
   - 20% Easy (Confidence builders)
   - 60% Medium (Core expertise)
   - 20% Hard (True pro tests)
2. DIVERSITY: Mix stats, history, milestones, and awards.
3. ACCURACY: All facts must be verified as of early 2025.
4. INTEGRITY: Output ONLY valid JSON. No prose or markdown wrappers.

# EXAMPLES OF EXCELLENCE

## Example 1 (Medium Difficulty)
{
  "text": "Long before it was known for the 'Cursed' Bambino era, this legendary stadium was often referred to as 'The Cathedral of Baseball' due to its majestic architecture. Which venue is it?",
  "difficulty": "medium",
  "topic": "Stadiums",
  "hint": "It was the home of the New York Yankees for 85 years.",
  "explanation": "Yankee Stadium's nickname reflected its status as a temple of the sport, housing more championships than any other venue in the 20th century.",
  "answers": [
    { "text": "Yankee Stadium", "isCorrect": true },
    { "text": "Fenway Park", "isCorrect": false },
    { "text": "Dodger Stadium", "isCorrect": false },
    { "text": "Wrigley Field", "isCorrect": false }
  ]
}

## Example 2 (Hard Difficulty)
{
  "text": "In a feat of endurance rarely seen in the modern era, this legendary center famously played every single minute of the 1961-62 season, save for just 8 minutes due to a disqualification. Who is he?",
  "difficulty": "hard",
  "topic": "NBA Records",
  "hint": "He also scored 100 points in a single game that same year.",
  "explanation": "Wilt Chamberlain's average of 48.5 minutes per game is considered one of sports' 'unbreakable' records, highlighting a level of physical dominance that defined his career.",
  "answers": [
    { "text": "Wilt Chamberlain", "isCorrect": true },
    { "text": "Bill Russell", "isCorrect": false },
    { "text": "Kareem Abdul-Jabbar", "isCorrect": false },
    { "text": "Oscar Robertson", "isCorrect": false }
  ]
}

## Example 3 (Easy Difficulty)
{
  "text": "Often described as the most important single point in a close game, a standard free throw is awarded after specific fouls. How many points is it worth?",
  "difficulty": "easy",
  "topic": "Rules",
  "hint": "It is an uncontested shot from the foul line.",
  "explanation": "The free throw is a fundamental part of basketball strategy, often deciding the outcome of playoff games in the final seconds.",
  "answers": [
    { "text": "1", "isCorrect": true },
    { "text": "2", "isCorrect": false },
    { "text": "3", "isCorrect": false },
    { "text": "0", "isCorrect": false }
  ]
}`;

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

const SETTINGS_CACHE_TTL_MS = 10 * 60 * 1000;

type CachedSetting = {
  value: string;
  expiresAt: number;
};

const settingsCache = new Map<string, CachedSetting>();

function getCachedSetting(key: string): string | null {
  const cached = settingsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    settingsCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedSetting(key: string, value: string): void {
  settingsCache.set(key, {
    value,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  });
}

function clearCachedSetting(key: string): void {
  settingsCache.delete(key);
}

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
    setCachedSetting(key, value);
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
    const cached = getCachedSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT);
    if (cached) return cached;
    const customPrompt = await getSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT);
    const resolved = customPrompt || DEFAULT_AI_QUIZ_PROMPT;
    setCachedSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT, resolved);
    return resolved;
  } catch {
    // If database error, return default
    return DEFAULT_AI_QUIZ_PROMPT;
  }
}

// Update AI Quiz Prompt
export async function updateAIQuizPrompt(prompt: string, updatedBy?: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT, prompt, "ai", updatedBy);
  clearCachedSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT);
}

// Reset AI Quiz Prompt to default
export async function resetAIQuizPrompt(): Promise<void> {
  try {
    await prisma.appSettings.delete({
      where: { key: SETTINGS_KEYS.AI_QUIZ_PROMPT },
    });
    clearCachedSetting(SETTINGS_KEYS.AI_QUIZ_PROMPT);
  } catch {
    // Ignore if doesn't exist
  }
}

// Get AI Model (with fallback to default)
export async function getAIModel(): Promise<string> {
  try {
    const cached = getCachedSetting(SETTINGS_KEYS.AI_MODEL);
    if (cached) return cached;
    const customModel = await getSetting(SETTINGS_KEYS.AI_MODEL);
    const resolved = customModel || DEFAULT_AI_MODEL;
    setCachedSetting(SETTINGS_KEYS.AI_MODEL, resolved);
    return resolved;
  } catch {
    // If database error, return default
    return DEFAULT_AI_MODEL;
  }
}

// Update AI Model
export async function updateAIModel(model: string, updatedBy?: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.AI_MODEL, model, "ai", updatedBy);
  clearCachedSetting(SETTINGS_KEYS.AI_MODEL);
}
