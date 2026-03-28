import { buildAIResponseCacheKey, getCachedAIResponse, setCachedAIResponse } from "@/lib/services/ai-response-cache";

/**
 * Shared OpenAI API client with hybrid support for Responses API and Chat Completions API.
 * 
 * This service provides unified functions for calling OpenAI APIs with automatic routing:
 * - GPT-5 models → Responses API (/v1/responses)
 * - Other models → Chat Completions API (/v1/chat/completions)
 */

export class TaskCancelledError extends Error {
  constructor(message = "Task cancelled") {
    super(message);
    this.name = "TaskCancelledError";
  }
}

export type AIBudgetPolicy = {
  maxTotalTokens?: number;
  maxEstimatedCostUsd?: number;
  fallbackModels?: string[];
  hardFailOnExceed?: boolean;
};

type OpenAIRequestOptions = {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" } | null;
  cacheable?: boolean;
  cacheKeyContext?: Record<string, unknown>;
  cancellationCheck?: () => Promise<boolean>;
  budgetPolicy?: AIBudgetPolicy;
};

type LLMTelemetry = {
  model: string;
  initialModel: string;
  fallbackUsed: boolean;
  fallbackFrom?: string | null;
  retryCount: number;
  cacheHit: boolean;
  api: "responses" | "chat_completions";
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  budget: AIBudgetPolicy | null;
};

const MODEL_PRICING_USD_PER_1K_TOKENS: Record<string, { prompt: number; completion: number }> = {
  "gpt-5": { prompt: 0.005, completion: 0.015 },
  "gpt-5-chat": { prompt: 0.005, completion: 0.015 },
  "gpt-5-mini": { prompt: 0.0015, completion: 0.0045 },
  "gpt-5-nano": { prompt: 0.0006, completion: 0.0018 },
  "gpt-4o": { prompt: 0.005, completion: 0.015 },
  "gpt-4o-mini": { prompt: 0.00015, completion: 0.0006 },
  "o1": { prompt: 0.015, completion: 0.06 },
  "o1-preview": { prompt: 0.015, completion: 0.06 },
  "o1-mini": { prompt: 0.003, completion: 0.012 },
  "gpt-4-turbo": { prompt: 0.01, completion: 0.03 },
  "gpt-4": { prompt: 0.03, completion: 0.06 },
  "gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
};

function normalizeModelForPricing(model: string): string {
  if (model.startsWith("gpt-5-nano")) return "gpt-5-nano";
  if (model.startsWith("gpt-5-mini")) return "gpt-5-mini";
  if (model.startsWith("gpt-5-chat")) return "gpt-5-chat";
  if (model.startsWith("gpt-5")) return "gpt-5";
  if (model.startsWith("gpt-4o-mini")) return "gpt-4o-mini";
  if (model.startsWith("gpt-4o")) return "gpt-4o";
  if (model.startsWith("o1-mini")) return "o1-mini";
  if (model.startsWith("o1-preview")) return "o1-preview";
  if (model.startsWith("o1")) return "o1";
  if (model.startsWith("gpt-4-turbo")) return "gpt-4-turbo";
  if (model.startsWith("gpt-4")) return "gpt-4";
  if (model.startsWith("gpt-3.5-turbo")) return "gpt-3.5-turbo";
  return "gpt-4o";
}

function roughTokenEstimate(text: string): number {
  return Math.max(1, Math.ceil((text || "").length / 4));
}

function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING_USD_PER_1K_TOKENS[normalizeModelForPricing(model)];
  const promptCost = (promptTokens / 1000) * pricing.prompt;
  const completionCost = (completionTokens / 1000) * pricing.completion;
  return Number((promptCost + completionCost).toFixed(6));
}

async function callResponsesAPIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  maxRetries = 3,
  options?: { cancellationCheck?: () => Promise<boolean> }
): Promise<{ completion: any; retryCount: number }> {
  const fullPrompt = `${systemMessage}\n\n${prompt}`;
  const requestBody: any = {
    model: aiModel,
    input: fullPrompt,
    reasoning: { effort: "medium" },
    text: { verbosity: "medium" },
    max_output_tokens: 16000,
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (options?.cancellationCheck && (await options.cancellationCheck())) {
        throw new TaskCancelledError("Task cancelled before OpenAI Responses API call");
      }
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return { completion: await response.json(), retryCount: attempt };
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
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
      if (error instanceof TaskCancelledError) throw error;
      if (attempt === maxRetries - 1) throw error;
      if (error instanceof Error && !error.message.includes("OpenAI Responses API error")) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI Client] Responses API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Network error)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to call OpenAI Responses API after retries");
}

async function callChatCompletionsAPIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  options: OpenAIRequestOptions = {},
  maxRetries = 3
): Promise<{ completion: any; retryCount: number }> {
  const isO1 = aiModel.startsWith("o1");
  const requestBody: any = {
    model: aiModel,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
  };

  if (!isO1 && options.temperature !== undefined) {
    requestBody.temperature = options.temperature;
  } else if (!isO1 && options.temperature === undefined) {
    requestBody.temperature = 0.8;
  }
  if (options.maxTokens !== undefined) {
    requestBody.max_tokens = options.maxTokens;
  } else {
    requestBody.max_tokens = isO1 ? 16000 : 4000;
  }
  if (!isO1 && options.responseFormat !== null) {
    requestBody.response_format = options.responseFormat || { type: "json_object" };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (options.cancellationCheck && (await options.cancellationCheck())) {
        throw new TaskCancelledError("Task cancelled before OpenAI Chat Completions API call");
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return { completion: await response.json(), retryCount: attempt };
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
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
      if (error instanceof TaskCancelledError) throw error;
      if (attempt === maxRetries - 1) throw error;
      if (error instanceof Error && !error.message.includes("OpenAI Chat Completions API error")) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI Client] Chat Completions API retry ${attempt + 1}/${maxRetries} after ${delay}ms delay (Network error)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to call OpenAI Chat Completions API after retries");
}

export async function callOpenAIWithRetry(
  aiModel: string,
  prompt: string,
  systemMessage: string,
  options: OpenAIRequestOptions = {},
  maxRetries = 3
): Promise<any> {
  const models = [aiModel, ...(options.budgetPolicy?.fallbackModels || [])]
    .map((m) => m.trim())
    .filter(Boolean)
    .filter((model, idx, arr) => arr.indexOf(model) === idx);
  const cacheable = options.cacheable !== false;
  const fullPrompt = `${systemMessage}\n\n${prompt}`;
  const estimatedPromptTokens = roughTokenEstimate(fullPrompt);
  const maxCompletionTokens = options.maxTokens ?? (aiModel.startsWith("o1") ? 16000 : 4000);
  const budget = options.budgetPolicy || null;
  const startTime = Date.now();

  let lastError: unknown = null;
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const isGPT5 = model.startsWith("gpt-5");
    const isO1 = model.startsWith("o1");
    const estimatedTotalTokens = estimatedPromptTokens + maxCompletionTokens;
    const estimatedUsd = estimateCostUsd(model, estimatedPromptTokens, maxCompletionTokens);

    if (budget?.maxEstimatedCostUsd !== undefined && estimatedUsd > budget.maxEstimatedCostUsd) {
      if (modelIndex < models.length - 1) continue;
      if (budget.hardFailOnExceed !== false) {
        throw new Error(`Estimated AI cost ${estimatedUsd} exceeds budget ${budget.maxEstimatedCostUsd}.`);
      }
    }
    if (budget?.maxTotalTokens !== undefined && estimatedTotalTokens > budget.maxTotalTokens) {
      if (modelIndex < models.length - 1) continue;
      if (budget.hardFailOnExceed !== false) {
        throw new Error(`Estimated AI tokens ${estimatedTotalTokens} exceed budget ${budget.maxTotalTokens}.`);
      }
    }

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

    let cacheKey: string | null = null;
    if (cacheable) {
      cacheKey = buildAIResponseCacheKey({
        model,
        systemMessage,
        prompt,
        api: isGPT5 ? "responses" : "chat_completions",
        options: cacheKeyOptions,
        ...(options.cacheKeyContext ? { context: options.cacheKeyContext } : {}),
      });
      const cached = getCachedAIResponse<any>(cacheKey);
      if (cached) {
        const usage = cached?.usage || {};
        const promptTokens = usage.prompt_tokens || estimatedPromptTokens;
        const completionTokens = usage.completion_tokens || usage.output_tokens || 0;
        const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
        const telemetry: LLMTelemetry = {
          model,
          initialModel: aiModel,
          fallbackUsed: model !== aiModel,
          fallbackFrom: model !== aiModel ? aiModel : null,
          retryCount: 0,
          cacheHit: true,
          api: isGPT5 ? "responses" : "chat_completions",
          totalTokens,
          promptTokens,
          completionTokens,
          estimatedCostUsd: estimateCostUsd(model, promptTokens, completionTokens),
          durationMs: Date.now() - startTime,
          budget,
        };
        (cached as any)._codexMeta = telemetry;
        return cached;
      }
    }

    try {
      const response = isGPT5
        ? await callResponsesAPIWithRetry(model, prompt, systemMessage, maxRetries, {
          cancellationCheck: options.cancellationCheck,
        })
        : await callChatCompletionsAPIWithRetry(model, prompt, systemMessage, options, maxRetries);
      const completion = response.completion;
      const usage = completion?.usage || {};
      const promptTokens = usage.prompt_tokens || estimatedPromptTokens;
      const completionTokens = usage.completion_tokens || usage.output_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
      const actualUsd = estimateCostUsd(model, promptTokens, completionTokens);

      if (budget?.maxTotalTokens !== undefined && totalTokens > budget.maxTotalTokens && budget.hardFailOnExceed !== false) {
        if (modelIndex < models.length - 1) continue;
        throw new Error(`Total token usage ${totalTokens} exceeded hard budget ${budget.maxTotalTokens}.`);
      }
      if (budget?.maxEstimatedCostUsd !== undefined && actualUsd > budget.maxEstimatedCostUsd && budget.hardFailOnExceed !== false) {
        if (modelIndex < models.length - 1) continue;
        throw new Error(`Estimated AI cost ${actualUsd} exceeded hard budget ${budget.maxEstimatedCostUsd}.`);
      }

      const telemetry: LLMTelemetry = {
        model,
        initialModel: aiModel,
        fallbackUsed: model !== aiModel,
        fallbackFrom: model !== aiModel ? aiModel : null,
        retryCount: response.retryCount,
        cacheHit: false,
        api: isGPT5 ? "responses" : "chat_completions",
        totalTokens,
        promptTokens,
        completionTokens,
        estimatedCostUsd: actualUsd,
        durationMs: Date.now() - startTime,
        budget,
      };
      (completion as any)._codexMeta = telemetry;
      if (cacheable && cacheKey) {
        setCachedAIResponse(cacheKey, completion);
      }
      return completion;
    } catch (error) {
      lastError = error;
      if (error instanceof TaskCancelledError) throw error;
      if (modelIndex === models.length - 1) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to call OpenAI API");
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
