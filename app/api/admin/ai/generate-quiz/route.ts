import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, BadRequestError } from "@/lib/errors";
import { z } from "zod";
import { getAIQuizPrompt, getAIModel } from "@/lib/services/settings.service";

const generateQuizSchema = z.object({
  topic: z.string().min(1),
  sport: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  numQuestions: z.number().int().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestError(
        "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables."
      );
    }

    const body = await request.json();
    const { topic, sport, difficulty, numQuestions } = generateQuizSchema.parse(body);

    // Determine sport from topic or use provided
    const quizSport = sport || determineSportFromTopic(topic);

    // Create slugified version of topic
    const slugifiedTopic = topic
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
    const prompt = buildPrompt(promptTemplate, topic, quizSport, difficulty, numQuestions, slugifiedTopic);

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

    return successResponse({
      quiz: generatedQuiz,
      metadata: {
        topic,
        sport: quizSport,
        difficulty,
        numQuestions,
        model: aiModel,
        tokensUsed: completion.usage?.total_tokens || 0,
        promptPreview: prompt.substring(0, 200) + "...", // First 200 chars of actual prompt used
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

function buildPrompt(
  template: string,
  topic: string,
  sport: string,
  difficulty: string,
  numQuestions: number,
  slugifiedTopic: string
): string {
  // Replace all placeholders in the template
  return template
    .replace(/\{\{TOPIC\}\}/g, topic)
    .replace(/\{\{TOPIC_LOWER\}\}/g, topic.toLowerCase())
    .replace(/\{\{SLUGIFIED_TOPIC\}\}/g, slugifiedTopic)
    .replace(/\{\{SPORT\}\}/g, sport)
    .replace(/\{\{DIFFICULTY\}\}/g, difficulty)
    .replace(/\{\{NUM_QUESTIONS\}\}/g, numQuestions.toString())
    .replace(/\{\{DURATION\}\}/g, (numQuestions * 60).toString());
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

