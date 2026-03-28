import { BackgroundTaskType } from "@prisma/client";
import type { AIBudgetPolicy } from "@/lib/services/ai-openai-client.service";

const DEFAULT_FALLBACK_MODELS = ["gpt-4o-mini", "gpt-3.5-turbo"];

export function getBudgetPolicyForTaskType(type: BackgroundTaskType): AIBudgetPolicy {
  switch (type) {
    case BackgroundTaskType.AI_QUIZ_GENERATION:
      return {
        maxTotalTokens: 18000,
        maxEstimatedCostUsd: 0.18,
        fallbackModels: DEFAULT_FALLBACK_MODELS,
        hardFailOnExceed: true,
      };
    case BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION:
      return {
        maxTotalTokens: 14000,
        maxEstimatedCostUsd: 0.12,
        fallbackModels: DEFAULT_FALLBACK_MODELS,
        hardFailOnExceed: true,
      };
    case BackgroundTaskType.TOPIC_TYPE_AUDIT:
      return {
        maxTotalTokens: 2500,
        maxEstimatedCostUsd: 0.03,
        fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
        hardFailOnExceed: true,
      };
    default:
      return {
        maxTotalTokens: 12000,
        maxEstimatedCostUsd: 0.1,
        fallbackModels: DEFAULT_FALLBACK_MODELS,
        hardFailOnExceed: true,
      };
  }
}

export function getBudgetPolicyForRequest(kind: "quiz_suggest" | "quiz_metadata" | "question_fix"): AIBudgetPolicy {
  switch (kind) {
    case "quiz_suggest":
      return {
        maxTotalTokens: 9000,
        maxEstimatedCostUsd: 0.08,
        fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
        hardFailOnExceed: true,
      };
    case "quiz_metadata":
      return {
        maxTotalTokens: 2200,
        maxEstimatedCostUsd: 0.02,
        fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
        hardFailOnExceed: true,
      };
    case "question_fix":
      return {
        maxTotalTokens: 3500,
        maxEstimatedCostUsd: 0.03,
        fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
        hardFailOnExceed: true,
      };
    default:
      return {
        maxTotalTokens: 8000,
        maxEstimatedCostUsd: 0.06,
        fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"],
        hardFailOnExceed: true,
      };
  }
}
