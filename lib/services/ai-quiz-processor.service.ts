import {
  getBackgroundTaskById,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
  updateBackgroundTask,
  updateTaskProgress as updateTaskProgressInDB,
} from "@/lib/services/background-task.service";
import { getAIQuizPrompt, getAIModel } from "@/lib/services/settings.service";
import { BackgroundTaskType } from "@prisma/client";
import {
  callOpenAIWithRetry,
  extractContentFromCompletion,
  extractUsageStats,
} from "@/lib/services/ai-openai-client.service";

interface SourceMaterial {
  url: string;
  title: string | null;
  contentSnippet: string;
  derivedTopic: string | null;
}

/**
 * Main processing function for AI quiz generation tasks.
 * This function handles the complete workflow from task retrieval to completion.
 * 
 * @param taskId - The ID of the background task to process
 * @throws Error if task processing fails
 */
export async function processAIQuizTask(taskId: string): Promise<void> {
  try {
    await markBackgroundTaskInProgress(taskId);
    await updateTaskProgress(taskId, { percentage: 0.1, status: "Initializing..." });

    // Get task from database
    const task = await getBackgroundTaskById(taskId);

    if (!task || !task.input) {
      throw new Error("Task not found or missing input");
    }

    if (task.type !== BackgroundTaskType.AI_QUIZ_GENERATION) {
      throw new Error("Task is not an AI quiz generation task");
    }

    const input = task.input as any;
    const {
      topic,
      customTitle,
      sport,
      difficulty,
      numQuestions,
      sourceUrl,
      effectiveTopic,
      quizSport,
      sourceMaterial: sourceMaterialData,
    } = input;

    // Reconstruct sourceMaterial if it was stored
    let sourceMaterial: SourceMaterial | null = null;
    if (sourceMaterialData) {
      sourceMaterial = sourceMaterialData as SourceMaterial;
    } else if (sourceUrl) {
      // Fetch if not stored (for backwards compatibility)
      await updateTaskProgress(taskId, { percentage: 0.2, status: "Fetching source material..." });
      sourceMaterial = await fetchSourceMaterial(sourceUrl);
    }

    // Normalize topic to avoid undefined/empty strings from legacy tasks
    const resolvedTopic = (effectiveTopic || topic || customTitle || "Sports Quiz").trim();

    // Create slugified version of topic
    const slugifiedTopic = resolvedTopic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Get the prompt template and model from settings
    await updateTaskProgress(taskId, { percentage: 0.3, status: "Preparing AI request..." });
    const promptTemplate = await getAIQuizPrompt();
    const aiModel = await getAIModel();

    // Log for debugging
    console.log("[AI Generator] Processing task:", taskId);
    console.log("[AI Generator] Using model:", aiModel);
    console.log("[AI Generator] Prompt template loaded");

    // Build the prompt with placeholders replaced
    const resolvedSport = (quizSport || sport || determineSportFromTopic(resolvedTopic)).trim() || "General";

    const prompt = buildPrompt(
      promptTemplate,
      resolvedTopic,
      resolvedSport,
      difficulty,
      numQuestions,
      slugifiedTopic,
      {
        customTitle: customTitle?.trim(),
        sourceMaterial,
      }
    );

    // Build system message based on model type
    const isO1 = aiModel.startsWith("o1");
    let systemMessage = "You are a Senior Producer for a televised sports trivia show. You create engaging, story-driven, and historically accurate sports trivia in strict JSON format.";
    if (isO1) {
      systemMessage = "You are a Senior Producer for a televised sports trivia show. CRITICAL: You must output ONLY valid JSON. No markdown, no explanations, no additional text - just pure JSON matching the exact structure specified in the user prompt.";
    }

    // Call OpenAI API with retry logic
    await updateTaskProgress(taskId, { percentage: 0.4, status: "Calling OpenAI API..." });
    const completion = await callOpenAIWithRetry(
      aiModel,
      prompt,
      systemMessage,
      {
        temperature: 0.8,
        maxTokens: isO1 ? 16000 : 4000,
        responseFormat: isO1 ? null : { type: "json_object" },
        cacheable: true,
        cacheKeyContext: sourceMaterial ? { sourceHash: sourceMaterial.contentSnippet.substring(0, 100) } : undefined,
      }
    );

    await updateTaskProgress(taskId, { percentage: 0.8, status: "Parsing response..." });

    // Extract content from response
    const generatedContent = extractContentFromCompletion(completion, aiModel);

    console.log("[AI Generator] Generated content length:", generatedContent.length);

    // Store raw OpenAI response permanently (expensive API call - don't lose it!)
    // This allows us to retry parsing without another API call
    const rawResponseData = {
      rawCompletion: completion,
      rawGeneratedContent: generatedContent,
      prompt: prompt.substring(0, 5000), // Store prompt preview (truncated if very long)
    };

    // Extract JSON from potential markdown or text wrapper
    // This is especially important for o1 models which don't support JSON mode
    const cleanedContent = extractJSON(generatedContent);
    if (cleanedContent !== generatedContent) {
      console.log("[AI Generator] Extracted JSON from wrapper");
    }

    // Parse the generated JSON
    let generatedQuiz;
    let parseError: string | null = null;
    try {
      generatedQuiz = JSON.parse(cleanedContent);
    } catch (error: any) {
      parseError = error.message;
      console.error("[AI Generator] Failed to parse AI output");

      // Store raw response even on parse failure so we can retry parsing later
      await updateBackgroundTask(taskId, {
        result: {
          rawResponse: rawResponseData,
          parseError: {
            message: parseError,
            cleanedContent: cleanedContent.substring(0, 2000), // Store first 2000 chars for debugging
            fullCleanedContent: cleanedContent, // Store full content for retry
          },
          canRetryParsing: true,
        },
      });

      throw new Error(`Failed to parse generated quiz JSON. Error: ${error.message}. This may happen with o1 models - try GPT-4o or GPT-5 instead. You can retry parsing from the admin portal.`);
    }

    // Validate quiz structure - ensure it has questions
    if (!generatedQuiz || typeof generatedQuiz !== 'object') {
      const validationError = "Generated quiz is not a valid object";
      console.error("[AI Generator] Validation failed:", validationError);
      await updateBackgroundTask(taskId, {
        result: {
          rawResponse: rawResponseData,
          parseError: {
            message: validationError,
            cleanedContent: cleanedContent.substring(0, 2000),
            fullCleanedContent: cleanedContent,
          },
          canRetryParsing: true,
        },
      });
      throw new Error(`Generated quiz structure is invalid: ${validationError}. You can retry parsing from the admin portal.`);
    }

    // Validate questions array exists
    if (!Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
      const validationError = "Generated quiz has no questions array or questions array is empty";
      console.error("[AI Generator] Validation failed:", validationError);
      console.error("[AI Generator] Generated quiz structure invalid");
      await updateBackgroundTask(taskId, {
        result: {
          rawResponse: rawResponseData,
          parseError: {
            message: validationError,
            cleanedContent: cleanedContent.substring(0, 2000),
            fullCleanedContent: cleanedContent,
          },
          canRetryParsing: true,
        },
      });
      throw new Error(`Generated quiz validation failed: ${validationError}. The AI response may be malformed. You can retry parsing from the admin portal.`);
    }

    // Normalize difficulty values to uppercase (in case AI uses lowercase)
    if (generatedQuiz.difficulty) {
      generatedQuiz.difficulty = generatedQuiz.difficulty.toUpperCase();
    }
    if (Array.isArray(generatedQuiz.questions)) {
      generatedQuiz.questions = generatedQuiz.questions.map((q: any) => ({
        ...q,
        difficulty: q.difficulty ? q.difficulty.toUpperCase() : "MEDIUM",
      }));
    }

    await updateTaskProgress(taskId, { percentage: 0.9, status: "Finalizing..." });

    // Extract usage stats - different APIs have different structures
    const usageStats = extractUsageStats(completion);

    const metadata = {
      topic: resolvedTopic,
      sport: resolvedSport,
      difficulty,
      numQuestions,
      model: aiModel,
      api: usageStats.api,
      tokensUsed: usageStats.tokensUsed,
      promptPreview: `${prompt.substring(0, 200)}...`,
      ...(customTitle ? { customTitle } : {}),
      ...(sourceMaterial
        ? {
          sourceUrl: sourceMaterial.url,
          sourceTitle: sourceMaterial.title,
        }
        : {}),
    };

    // Store completed result with raw response for future reference/retry
    await markBackgroundTaskCompleted(taskId, {
      quiz: generatedQuiz,
      metadata,
      rawResponse: rawResponseData, // Store permanently for retry capability
      canRetryParsing: true, // Flag indicating this task can have parsing retried
    });

    console.log(`[AI Generator] ✅ Task ${taskId} completed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[AI Generator] ❌ Task ${taskId} failed:`, message);
    await markBackgroundTaskFailed(taskId, message);
    throw error;
  }
}

/**
 * Updates task progress in the database.
 * Wrapper around background-task.service updateTaskProgress for convenience.
 */
async function updateTaskProgress(
  taskId: string,
  progress: { percentage: number; status: string }
): Promise<void> {
  await updateTaskProgressInDB(taskId, progress);
}

/**
 * Builds the prompt by replacing placeholders in the template.
 */
export function buildPrompt(
  template: string,
  topic: string,
  sport: string,
  difficulty: string,
  numQuestions: number,
  slugifiedTopic: string,
  options?: {
    customTitle?: string | null;
    sourceMaterial?: SourceMaterial | null;
  }
): string {
  // Prefix instructions to help with prompt caching (static instructions first)
  const prefix = `TV EPISODE BRIEF:
- Topic: ${topic}
- Sport Context: ${sport}
- Segment Length: ${numQuestions} Questions
- Difficulty Tier: ${difficulty}
- Est. Duration: ${numQuestions * 60} seconds
`;

  // Start with the instructions then the template
  let prompt = prefix + template;

  // Add the variable contexts at the end to keep the prefix stable
  if (options?.customTitle) {
    prompt += `\n\nSet the quiz "title" field to "${options.customTitle}" and keep the overall theme aligned with this title.`;
  }

  if (options?.sourceMaterial) {
    const { url, title, contentSnippet } = options.sourceMaterial;
    prompt += `\n\nIncorporate the key facts from the following source when writing questions. Focus on accuracy and do not invent details not supported by the source.\nSource URL: ${url}${title ? `\nSource Title: ${title}` : ""
      }\nSource Content:\n"""\n${contentSnippet}\n"""`;
  }

  // Final replacement of placeholders in the entire prompt (after variable parts are appended)
  prompt = prompt
    .replace(/\{\{TOPIC\}\}/g, topic)
    .replace(/\{\{TOPIC_LOWER\}\}/g, topic.toLowerCase())
    .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slugifiedTopic)
    .replace(/\{\{SPORT\}\}/g, sport)
    .replace(/\{\{DIFFICULTY\}\}/g, difficulty)
    .replace(/\{\{NUM_QUESTIONS\}\}/g, numQuestions.toString())
    .replace(/\{\{DURATION\}\}/g, (numQuestions * 60).toString());

  return prompt;
}

/**
 * Extracts JSON from text that might have markdown wrappers or extra content.
 * This is especially important for o1 models which don't support JSON mode.
 * Handles cases where there's trailing text after the JSON object.
 */
export function extractJSON(content: string): string {
  // Remove leading/trailing whitespace
  content = content.trim();

  // Try to extract from markdown code block (```json ... ``` or ``` ... ```)
  const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    const extracted = markdownMatch[1].trim();
    // Try to find valid JSON within the code block
    const jsonInBlock = findValidJSON(extracted);
    if (jsonInBlock) {
      return jsonInBlock;
    }
  }

  // Try to find a valid JSON object in the content
  const jsonObject = findValidJSON(content);
  if (jsonObject) {
    return jsonObject;
  }

  // Fallback: try the old regex method (but this might fail parsing)
  const jsonMatch = content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Return original if no JSON found
  return content;
}

/**
 * Finds a valid JSON object in text by trying to parse incrementally.
 * This handles cases where there's text after the JSON object ends.
 */
function findValidJSON(text: string): string | null {
  // Find the first opening brace
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    return null;
  }

  // Start from the first brace and try to find a complete JSON object
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let start = firstBrace;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    // Handle string escaping
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    // Track string boundaries
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    // Only count braces outside of strings
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;

        // When we close all braces, we have a complete JSON object
        if (braceCount === 0) {
          const candidate = text.substring(start, i + 1);

          // Try to parse it to verify it's valid JSON
          try {
            JSON.parse(candidate);
            return candidate.trim();
          } catch {
            // Not valid JSON, continue searching
            // Sometimes there might be nested objects or arrays
            // Reset and look for the next opening brace
            start = text.indexOf('{', i + 1);
            if (start === -1) break;
            i = start - 1;
            braceCount = 0;
            continue;
          }
        }
      }
    }
  }

  // If we reach here, try parsing the whole thing from first brace to end
  // This handles cases where the JSON is at the end
  if (braceCount !== 0 && start !== -1) {
    const candidate = text.substring(start);
    try {
      JSON.parse(candidate);
      return candidate.trim();
    } catch {
      // Not valid, return null
    }
  }

  return null;
}

/**
 * Fetches and parses source material from a URL for quiz generation.
 */
export async function fetchSourceMaterial(sourceUrl: string): Promise<SourceMaterial | null> {
  try {
    const parsedUrl = new URL(sourceUrl);
    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "SportsTriviaAI/1.0 (+https://sportstrivia.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[AI Generator] Failed to fetch source URL:", sourceUrl, response.status);
      return {
        url: parsedUrl.toString(),
        title: null,
        contentSnippet: "",
        derivedTopic: parsedUrl.hostname.replace(/^www\./, ""),
      };
    }

    const rawContent = await response.text();
    const titleMatch = rawContent.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;
    const textContent = stripHtml(rawContent);
    const contentSnippet = truncateText(textContent, 4000);
    const derivedTopic = title || parsedUrl.hostname.replace(/^www\./, "");

    return {
      url: parsedUrl.toString(),
      title,
      contentSnippet,
      derivedTopic,
    };
  } catch (error) {
    console.warn("[AI Generator] Error fetching source URL:", sourceUrl, error);
    try {
      const fallbackUrl = new URL(sourceUrl);
      return {
        url: fallbackUrl.toString(),
        title: null,
        contentSnippet: "",
        derivedTopic: fallbackUrl.hostname.replace(/^www\./, ""),
      };
    } catch {
      return null;
    }
  }
}

/**
 * Strips HTML tags and scripts from content.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncates text to a specified character limit.
 */
export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

/**
 * Decodes HTML entities to plain text.
 */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/**
 * Determines sport from topic using keyword matching.
 */
export function determineSportFromTopic(topic: string): string {
  const topicLower = topic.toLowerCase();

  const sportKeywords: Record<string, string[]> = {
    Cricket: ["cricket", "ipl", "test match", "odi", "t20", "bcci", "shane warne", "nelson", "duck"],
    Basketball: ["basketball", "nba", "wnba", "dunk", "three-pointer", "lakers", "bulls"],
    Football: ["football", "nfl", "quarterback", "touchdown", "super bowl"],
    Soccer: ["soccer", "fifa", "premier league", "champions league", "messi", "ronaldo", "arsenal", "liverpool", "manchester", "bayern", "barcelona", "ac milan", "ucl"],
    Baseball: ["baseball", "mlb", "home run", "world series"],
    Tennis: ["tennis", "wimbledon", "grand slam", "atp", "wta", "australian open", "davis cup", "sampras", "federer", "nadal", "djokovic"],
    Hockey: ["hockey", "nhl", "stanley cup"],
    Golf: ["golf", "pga", "masters"],
    "Formula 1": ["f1", "formula 1", "grand prix", "hamilton", "verstappen", "ferrari"],
    Boxing: ["boxing", "tyson", "ali", "knockout", "heavyweight"],
    MMA: ["mma", "ufc", "conor", "octagon"],
    Badminton: ["badminton", "all england", "shuttlecock", "yonex"],
    Athletics: ["athletics", "marathon", "olympics", "usain", "track and field", "sprinter"],
    Olympics: ["olympic", "olympics", "gold medal", "medalist"],
  };

  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some(keyword => topicLower.includes(keyword))) {
      return sport;
    }
  }

  return "General";
}
