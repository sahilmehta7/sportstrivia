import { buildAIResponseCacheKey, getCachedAIResponse, setCachedAIResponse } from "@/lib/services/ai-response-cache";

/**
 * Shared OpenAI API client with hybrid support for Responses API and Chat Completions API.
 * 
 * This service provides unified functions for calling OpenAI APIs with automatic routing:
 * - GPT-5 models → Responses API (/v1/responses)
 * - Other models → Chat Completions API (/v1/chat/completions)
 */

/**
 * Calls the Responses API for GPT-5 models.
 * This API provides better parameter support for GPT-5 (max_output_tokens, reasoning_effort, verbosity).
 */
export async function callResponsesAPIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  maxRetries = 3
): Promise<any> {
  // Combine system message and user prompt for Responses API
  // Responses API uses 'input' field (single string) instead of messages array
  const fullPrompt = `${systemMessage}\n\n${prompt}`;

  // Build request body for Responses API
  const requestBody: any = {
    model: aiModel,
    input: fullPrompt,
    reasoning: {
      effort: "medium", // Use medium reasoning effort for quiz/question generation
    },
    text: {
      verbosity: "medium", // Medium verbosity for detailed content
    },
    max_output_tokens: 16000, // Proper parameter name for Responses API
  };

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return await response.json();
      }

      // Parse error response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

      // Retry on 429 (rate limit) or 5xx errors
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[OpenAI Client] Responses API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Status: ${response.status})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new Error(`OpenAI Responses API error: ${errorMessage}`);
    } catch (error) {
      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Network errors also retry
      if (error instanceof Error && !error.message.includes('OpenAI Responses API error')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI Client] Responses API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Network error)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If it's an API error that we shouldn't retry, throw immediately
      throw error;
    }
  }

  throw new Error("Failed to call OpenAI Responses API after retries");
}

type OpenAIRequestOptions = {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" } | null;
  cacheable?: boolean;
  cacheKeyContext?: Record<string, unknown>;
};

/**
 * Calls the Chat Completions API for non-GPT-5 models.
 */
export async function callChatCompletionsAPIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  options: OpenAIRequestOptions = {},
  maxRetries = 3
): Promise<any> {
  const isO1 = aiModel.startsWith("o1");

  // Build request body for Chat Completions API
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

  // o1 models don't support custom temperature (only default value)
  // Standard models support temperature
  if (!isO1 && options.temperature !== undefined) {
    requestBody.temperature = options.temperature;
  } else if (!isO1 && options.temperature === undefined) {
    requestBody.temperature = 0.8; // Default temperature
  }

  // Add token limit parameter - Chat Completions API uses 'max_tokens' for ALL models
  // For newer models, OpenAI is moving towards 'max_completion_tokens' but 'max_tokens' remains supported
  if (options.maxTokens !== undefined) {
    requestBody.max_tokens = options.maxTokens;
  } else {
    requestBody.max_tokens = isO1 ? 16000 : 4000;
  }

  // Only add response_format for models that support it
  // o1 models don't support response_format parameter in Chat Completions API
  if (!isO1 && options.responseFormat !== null) {
    requestBody.response_format = options.responseFormat || { type: "json_object" };
  }

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return await response.json();
      }

      // Parse error response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

      // Retry on 429 (rate limit) or 5xx errors
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[OpenAI Client] Chat Completions API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Status: ${response.status})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new Error(`OpenAI Chat Completions API error: ${errorMessage}`);
    } catch (error) {
      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Network errors also retry
      if (error instanceof Error && !error.message.includes('OpenAI Chat Completions API error')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI Client] Chat Completions API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Network error)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If it's an API error that we shouldn't retry, throw immediately
      throw error;
    }
  }

  throw new Error("Failed to call OpenAI Chat Completions API after retries");
}

/**
 * Calls OpenAI API with automatic routing to the appropriate endpoint.
 * - GPT-5 models: Uses Responses API (better parameter support)
 * - Other models: Uses Chat Completions API
 * 
 * @param aiModel - The model identifier (e.g., "gpt-5", "gpt-4o", "o1-preview")
 * @param prompt - The user prompt
 * @param systemMessage - The system message
 * @param options - Optional configuration for Chat Completions API
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The API response
 */
export async function callOpenAIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  options: OpenAIRequestOptions = {},
  maxRetries = 3
): Promise<any> {
  const isGPT5 = aiModel.startsWith("gpt-5");
  const isO1 = aiModel.startsWith("o1");
  const cacheable = options.cacheable !== false;
  let cacheKey: string | null = null;

  const cacheKeyOptions = isGPT5
    ? {}
    : {
      temperature: !isO1 ? options.temperature ?? 0.8 : undefined,
      maxTokens: options.maxTokens ?? (isO1 ? 16000 : 4000),
      responseFormat: !isO1
        ? options.responseFormat === null
          ? null
          : options.responseFormat ?? { type: "json_object" }
        : null,
    };

  if (cacheable) {
    cacheKey = buildAIResponseCacheKey({
      model: aiModel,
      systemMessage,
      prompt,
      api: isGPT5 ? "responses" : "chat_completions",
      options: cacheKeyOptions,
      ...(options.cacheKeyContext ? { context: options.cacheKeyContext } : {}),
    });

    const cached = getCachedAIResponse<any>(cacheKey);
    if (cached) {
      console.log(`[OpenAI Client] ✅ Cache hit for prompt (Key: ${cacheKey.substring(0, 8)}...)`);
      return cached;
    } else {
      console.log(`[OpenAI Client] 🔍 Cache miss for prompt (Key: ${cacheKey.substring(0, 8)}...)`);
    }
  }

  if (isGPT5) {
    // Use Responses API for GPT-5 models
    console.log("[OpenAI Client] Using Responses API for GPT-5 model");
    const completion = await callResponsesAPIWithRetry(aiModel, prompt, systemMessage, maxRetries);
    if (cacheable && cacheKey) {
      setCachedAIResponse(cacheKey, completion);
    }
    return completion;
  } else {
    // Use Chat Completions API for other models (GPT-4, GPT-4o, GPT-3.5-turbo, o1)
    console.log("[OpenAI Client] Using Chat Completions API for model:", aiModel);
    const completion = await callChatCompletionsAPIWithRetry(aiModel, prompt, systemMessage, options, maxRetries);
    if (cacheable && cacheKey) {
      setCachedAIResponse(cacheKey, completion);
    }
    return completion;
  }
}

/**
 * Extracts content from OpenAI completion response.
 * Handles different response formats from various API endpoints and model types.
 * 
 * Supports:
 * - Chat Completions API: choices[0].message.content
 * - Responses API: output_text, choices[0].message.content, or output
 */
export function extractContentFromCompletion(completion: any, aiModel: string): string {
  function coerceContentToString(
    value: any,
    visited: Set<any> = new Set()
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const valueType = typeof value;

    if (valueType === "string") {
      return value;
    }

    if (valueType === "number" || valueType === "boolean") {
      return String(value);
    }

    if (valueType !== "object") {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);
    try {
      if (Array.isArray(value)) {
        const parts: string[] = [];
        for (const item of value) {
          const part = coerceContentToString(item, visited);
          if (part) {
            parts.push(part);
          }
        }
        return parts.length ? parts.join("") : null;
      }

      if (typeof value.text === "string") {
        return value.text;
      }

      if (Array.isArray(value.text)) {
        const textFromArray = coerceContentToString(value.text, visited);
        if (textFromArray) {
          return textFromArray;
        }
      }

      if (value.type === "output_text" && typeof value.text === "string") {
        return value.text;
      }

      if (Array.isArray(value.content)) {
        const contentResult = coerceContentToString(value.content, visited);
        if (contentResult) {
          return contentResult;
        }
      } else if (typeof value.content === "string") {
        return value.content;
      }

      if (value.message) {
        const messageResult = coerceContentToString(value.message, visited);
        if (messageResult) {
          return messageResult;
        }
      }

      for (const key of ["output_text", "output", "value", "data"]) {
        if (value[key] !== undefined) {
          const nestedResult = coerceContentToString(value[key], visited);
          if (nestedResult) {
            return nestedResult;
          }
        }
      }

      return null;
    } finally {
      visited.delete(value);
    }
  }

  const tryCandidate = (candidate: any, label: string): string | null => {
    const normalized = coerceContentToString(candidate);
    if (normalized && normalized.trim().length > 0) {
      console.log(`[OpenAI Client] ✅ Found content in: ${label}`);
      return normalized;
    }
    return null;
  };

  const requestId = typeof completion?.id === "string" ? completion.id : "unknown";
  console.log("[OpenAI Client] Parsing completion response", {
    requestId,
    object: completion?.object ?? null,
    keys: Object.keys(completion ?? {}),
  });

  let generatedContent: string | null = null;

  // Check if this is a Responses API response
  const isResponsesAPI = completion.object === "response" || completion.object === "response_completion" || Object.prototype.hasOwnProperty.call(completion, "output_text");

  if (isResponsesAPI) {
    // Responses API formats
    // Path 1: output_text field (primary format for Responses API)
    generatedContent = tryCandidate(completion.output_text, "output_text (Responses API)");
    // Path 2: choices[0].message.content (some Responses API responses)
    if (!generatedContent && completion.choices?.[0]?.message?.content) {
      generatedContent = tryCandidate(completion.choices[0].message.content, "choices[0].message.content (Responses API)");
    }
    // Path 3: output field (alternative Responses API format)
    if (!generatedContent && completion.output) {
      generatedContent = tryCandidate(completion.output, "output (Responses API)");
    }
  } else {
    // Chat Completions API formats
    // Path 1: Standard chat completions format (most common)
    generatedContent = tryCandidate(completion.choices?.[0]?.message?.content, "choices[0].message.content (Chat Completions API)");
    // Path 2: Legacy text format
    if (!generatedContent && completion.choices?.[0]?.text) {
      generatedContent = tryCandidate(completion.choices[0].text, "choices[0].text");
    }
    // Path 3: Direct content field
    if (!generatedContent && completion.content) {
      generatedContent = tryCandidate(completion.content, "content");
    }
    // Path 4: Message.content at root
    if (!generatedContent && completion.message?.content) {
      generatedContent = tryCandidate(completion.message.content, "message.content");
    }
  }

  if (!generatedContent) {
    const fallback = tryCandidate(completion, "entire response (fallback)");
    if (fallback) {
      console.warn("[OpenAI Client] ⚠️ Falling back to entire response conversion");
      return fallback;
    }
    console.error("[OpenAI Client] ❌ Could not find content in any known path", {
      requestId,
      object: completion?.object ?? null,
      keys: Object.keys(completion ?? {}),
    });
    throw new Error(`No content generated from OpenAI. Model: ${aiModel}. API: ${isResponsesAPI ? 'Responses' : 'Chat Completions'}. Please check console for full response structure.`);
  }

  return generatedContent;
}

/**
 * Extracts usage statistics from OpenAI API response.
 * Handles different response formats from various API endpoints.
 */
export function extractUsageStats(completion: any): { tokensUsed: number; api: string } {
  let tokensUsed = 0;
  const isResponsesAPI = completion.object === "response" || completion.object === "response_completion" || Object.prototype.hasOwnProperty.call(completion, "output_text");

  if (completion.usage?.total_tokens) {
    // Chat Completions API format
    tokensUsed = completion.usage.total_tokens;
  } else if (completion.usage) {
    // Responses API might have different structure
    tokensUsed = completion.usage.total_tokens ||
      (completion.usage.prompt_tokens + completion.usage.completion_tokens) || 0;
  }

  return {
    tokensUsed,
    api: isResponsesAPI ? "responses" : "chat_completions",
  };
}
