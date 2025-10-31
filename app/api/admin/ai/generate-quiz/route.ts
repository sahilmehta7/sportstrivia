import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getAIQuizPrompt, getAIModel } from "@/lib/services/settings.service";
import {
  createBackgroundTask,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  markBackgroundTaskInProgress,
} from "@/lib/services/background-task.service";
import { BackgroundTaskType } from "@prisma/client";

// Use Node.js runtime for long-running AI operations
export const runtime = 'nodejs';

// Increase route timeout for AI generation (can take 30-60 seconds for large quizzes)
export const maxDuration = 60; // seconds

const generateQuizSchema = z
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
        message: "Provide a topic, custom title, or source URL for quiz generation.",
      });
    }
  });

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  try {
    const admin = await requireAdmin();

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError(
        "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables."
      );
    }

    const body = await request.json();
    const { topic, customTitle, sport, difficulty, numQuestions, sourceUrl } =
      generateQuizSchema.parse(body);

    let effectiveTopic = (customTitle || topic || "").trim();

    let sourceMaterial: SourceMaterial | null = null;
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
    const quizSport = sport || determineSportFromTopic(derivedSportContext);

    const backgroundTask = await createBackgroundTask({
      userId: admin.id,
      type: BackgroundTaskType.AI_QUIZ_GENERATION,
      label: `AI Quiz • ${effectiveTopic}`,
      input: {
        topic,
        customTitle,
        sport,
        difficulty,
        numQuestions,
        sourceUrl,
        effectiveTopic,
        quizSport,
      },
    });
    taskId = backgroundTask.id;
    await markBackgroundTaskInProgress(taskId);

    // Create slugified version of topic
    const slugifiedTopic = effectiveTopic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Get the prompt template and model from settings
    const promptTemplate = await getAIQuizPrompt();
    const aiModel = await getAIModel();
    
    // Log for debugging
    console.log("[AI Generator] Using model:", aiModel);
    console.log("[AI Generator] Prompt source:", promptTemplate.substring(0, 100) + "...");
    
    // Build the prompt with placeholders replaced
    const prompt = buildPrompt(
      promptTemplate,
      effectiveTopic,
      quizSport,
      difficulty,
      numQuestions,
      slugifiedTopic,
      {
        customTitle: customTitle?.trim(),
        sourceMaterial,
      }
    );

    // Determine if model uses new parameter naming
    // GPT-5 and o1 series use max_completion_tokens instead of max_tokens
    const usesNewParams = aiModel.startsWith("gpt-5") || aiModel.startsWith("o1");
    
    // Build system message based on model type
    let systemMessage = "You are an expert sports quiz creator. You create engaging, accurate, and well-structured sports trivia quizzes in strict JSON format.";
    
    // o1 models don't support response_format, so emphasize JSON-only in system message
    if (aiModel.startsWith("o1")) {
      systemMessage = "You are an expert sports quiz creator. CRITICAL: You must output ONLY valid JSON. No markdown, no explanations, no additional text - just pure JSON matching the exact structure specified in the user prompt.";
    }
    
    // Build request body based on model type
    const requestBody: any = {
      model: aiModel,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    // o1 and gpt-5 models don't support custom temperature (only default value of 1)
    if (!aiModel.startsWith("o1") && !aiModel.startsWith("gpt-5")) {
      requestBody.temperature = 0.8;
    }

    // Add token limit parameter based on model
    // GPT-5 and o1 models use reasoning tokens + output tokens, so need higher limits
    if (usesNewParams) {
      // For reasoning models, set much higher limit to account for internal reasoning
      requestBody.max_completion_tokens = 16000;  // Enough for reasoning + output
    } else {
      requestBody.max_tokens = 4000;
    }

    // Only add response_format for models that support it
    // o1 models don't support response_format parameter
    if (!aiModel.startsWith("o1")) {
      requestBody.response_format = {
        type: "json_object",
      };
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BadRequestError(
        `OpenAI API error: ${error.error?.message || "Unknown error"}`
      );
    }

    const completion = await response.json();
    
    // Comprehensive logging for debugging
    console.log("[AI Generator] Full API Response:", JSON.stringify(completion, null, 2));
    console.log("[AI Generator] Completion keys:", Object.keys(completion));
    console.log("[AI Generator] Choices:", completion.choices);
    console.log("[AI Generator] Choices[0]:", completion.choices?.[0]);
    console.log("[AI Generator] Message:", completion.choices?.[0]?.message);
    
    // Try different response paths for different model types
    let generatedContent = null;
    
    // Path 1: Standard chat completions format (most common)
    if (completion.choices?.[0]?.message?.content) {
      generatedContent = completion.choices[0].message.content;
      console.log("[AI Generator] ✅ Found content in: choices[0].message.content");
    }
    // Path 2: Legacy text format
    else if (completion.choices?.[0]?.text) {
      generatedContent = completion.choices[0].text;
      console.log("[AI Generator] ✅ Found content in: choices[0].text");
    }
    // Path 3: Direct content field
    else if (completion.content) {
      generatedContent = completion.content;
      console.log("[AI Generator] ✅ Found content in: content");
    }
    // Path 4: Message.content at root
    else if (completion.message?.content) {
      generatedContent = completion.message.content;
      console.log("[AI Generator] ✅ Found content in: message.content");
    }
    // Path 5: Check if there's an output field (some models)
    else if (completion.output) {
      generatedContent = completion.output;
      console.log("[AI Generator] ✅ Found content in: output");
    }
    // Path 6: Check for data field
    else if (completion.data) {
      generatedContent = completion.data;
      console.log("[AI Generator] ✅ Found content in: data");
    }

    if (!generatedContent) {
      console.error("[AI Generator] ❌ Could not find content in any known path");
      console.error("[AI Generator] Full completion object:", JSON.stringify(completion, null, 2));
      throw new BadRequestError(
        `No content generated from OpenAI. Model: ${aiModel}. Please check console for full response structure.`
      );
    }
    
    console.log("[AI Generator] Generated content length:", generatedContent.length);

    // Extract JSON from potential markdown or text wrapper
    // This is especially important for o1 models which don't support JSON mode
    const cleanedContent = extractJSON(generatedContent);
    if (cleanedContent !== generatedContent) {
      console.log("[AI Generator] Extracted JSON from wrapper");
      generatedContent = cleanedContent;
    }

    // Parse the generated JSON
    let generatedQuiz;
    try {
      generatedQuiz = JSON.parse(generatedContent);
    } catch (error: any) {
      console.error("[AI Generator] Failed to parse:", generatedContent.substring(0, 500));
      throw new BadRequestError(
        `Failed to parse generated quiz JSON. Error: ${error.message}. This may happen with o1 models - try GPT-4o or GPT-5 instead.`
      );
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

    const metadata = {
      topic: effectiveTopic,
      sport: quizSport,
      difficulty,
      numQuestions,
      model: aiModel,
      tokensUsed: completion.usage?.total_tokens || 0,
      promptPreview: `${prompt.substring(0, 200)}...`,
      ...(customTitle ? { customTitle } : {}),
      ...(sourceMaterial
        ? {
            sourceUrl: sourceMaterial.url,
            sourceTitle: sourceMaterial.title,
          }
        : {}),
    };

    if (taskId) {
      try {
        await markBackgroundTaskCompleted(taskId, {
          quiz: generatedQuiz,
          metadata,
        });
      } catch (taskError) {
        console.error("[AI Generator] Failed to mark background task completed:", taskError);
      }
    }

    return successResponse({
      taskId,
      quiz: generatedQuiz,
      metadata,
    });
  } catch (error) {
    if (taskId) {
      const message = error instanceof Error ? error.message : "Unknown error";
      try {
        await markBackgroundTaskFailed(taskId, message);
      } catch (taskError) {
        console.error("[AI Generator] Failed to update background task status:", taskError);
      }
    }
    return handleError(error);
  }
}

function buildPrompt(
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
  // Replace all placeholders in the template
  let prompt = template
    .replace(/\{\{TOPIC\}\}/g, topic)
    .replace(/\{\{TOPIC_LOWER\}\}/g, topic.toLowerCase())
    .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slugifiedTopic)
    .replace(/\{\{SPORT\}\}/g, sport)
    .replace(/\{\{DIFFICULTY\}\}/g, difficulty)
    .replace(/\{\{NUM_QUESTIONS\}\}/g, numQuestions.toString())
    .replace(/\{\{DURATION\}\}/g, (numQuestions * 60).toString());

  if (options?.customTitle) {
    prompt += `\n\nSet the quiz "title" field to "${options.customTitle}" and keep the overall theme aligned with this title.`;
  }

  if (options?.sourceMaterial) {
    const { url, title, contentSnippet } = options.sourceMaterial;
    prompt += `\n\nIncorporate the key facts from the following source when writing questions. Focus on accuracy and do not invent details not supported by the source.\nSource URL: ${url}${
      title ? `\nSource Title: ${title}` : ""
    }\nSource Content:\n"""\n${contentSnippet}\n"""`;
  }

  return prompt;
}

// Extract JSON from text that might have markdown wrappers or extra content
function extractJSON(content: string): string {
  // Remove leading/trailing whitespace
  content = content.trim();
  
  // Try to extract from markdown code block (```json ... ``` or ``` ... ```)
  const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  // Try to find a JSON object anywhere in the content
  const jsonMatch = content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // Return original if no JSON found
  return content;
}

// Simple sport detection based on common topic names
function determineSportFromTopic(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  const sportKeywords: Record<string, string[]> = {
    Cricket: ["cricket", "ipl", "test match", "odi", "t20", "bcci"],
    Basketball: ["basketball", "nba", "wnba", "dunk", "three-pointer"],
    Football: ["football", "nfl", "quarterback", "touchdown", "super bowl"],
    Soccer: ["soccer", "fifa", "premier league", "champions league", "messi", "ronaldo"],
    Baseball: ["baseball", "mlb", "home run", "world series"],
    Tennis: ["tennis", "wimbledon", "grand slam", "atp", "wta"],
    Hockey: ["hockey", "nhl", "stanley cup"],
    Golf: ["golf", "pga", "masters"],
  };

  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some(keyword => topicLower.includes(keyword))) {
      return sport;
    }
  }

  return "General";
}

interface SourceMaterial {
  url: string;
  title: string | null;
  contentSnippet: string;
  derivedTopic: string | null;
}

async function fetchSourceMaterial(sourceUrl: string): Promise<SourceMaterial | null> {
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

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}
