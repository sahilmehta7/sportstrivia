# Topic Question Generation: Hybrid API Implementation

## Overview

The AI topic question generation feature now uses the same hybrid API approach as quiz generation:
- **GPT-5 models** → Responses API (`/v1/responses`)
- **Other models** → Chat Completions API (`/v1/chat/completions`)

## Changes Made

### 1. Created Shared OpenAI Client Service
**File:** `lib/services/ai-openai-client.service.ts`

A new shared service that provides:
- `callOpenAIWithRetry()` - Automatic routing based on model
- `callResponsesAPIWithRetry()` - GPT-5 specific implementation
- `callChatCompletionsAPIWithRetry()` - Standard models implementation
- `extractContentFromCompletion()` - Unified content extraction
- `extractUsageStats()` - Unified usage tracking

**Benefits:**
- ✅ Single source of truth for OpenAI API calls
- ✅ Consistent error handling and retry logic
- ✅ Easy to maintain and update

### 2. Updated AI Quiz Processor
**File:** `lib/services/ai-quiz-processor.service.ts`

- Refactored to use shared `ai-openai-client.service`
- Removed duplicate API calling code
- Simplified implementation

### 3. Updated Topic Question Generation Route
**File:** `app/api/admin/topics/[id]/ai/generate-questions/route.ts`

**Key Changes:**
- ✅ Replaced direct OpenAI API calls with shared client
- ✅ Fixed incorrect `max_completion_tokens` parameter (was causing API errors)
- ✅ Now uses proper `max_output_tokens` for GPT-5 (Responses API)
- ✅ Now uses proper `max_tokens` for other models (Chat Completions API)
- ✅ Added API type tracking in result metadata

**Before:**
```typescript
// ❌ Incorrect - max_completion_tokens doesn't exist in Chat Completions API
if (usesNewParams) {
  requestBody.max_completion_tokens = 16000;
} else {
  requestBody.max_tokens = 4000;
}
```

**After:**
```typescript
// ✅ Correct - automatic routing with proper parameters
const completion = await callOpenAIWithRetry(
  aiModel,
  prompt,
  systemMessage,
  {
    temperature: 0.8,
    maxTokens: isO1 ? 16000 : 4000,
    responseFormat: isO1 ? null : { type: "json_object" },
  }
);
```

## Bug Fixes

### Fixed `max_completion_tokens` Parameter Error
**Issue:** The topic question generation route was using `max_completion_tokens`, which doesn't exist in the Chat Completions API.

**Impact:** This would cause API errors for GPT-5 models.

**Solution:** Now uses the shared client which automatically:
- Uses `max_output_tokens` for GPT-5 (Responses API)
- Uses `max_tokens` for other models (Chat Completions API)

## API Routing

### GPT-5 Models
```
gpt-5, gpt-5-mini, gpt-5-nano
→ /v1/responses
→ max_output_tokens: 16000
→ reasoning.effort: "medium"
→ text.verbosity: "medium"
```

### Other Models
```
gpt-4o, gpt-4, gpt-3.5-turbo, o1-preview
→ /v1/chat/completions
→ max_tokens: 4000 (o1: 16000)
→ temperature: 0.8 (o1: undefined)
→ response_format: { type: "json_object" } (o1: null)
```

## Response Format Handling

The shared `extractContentFromCompletion()` function handles:
- **Responses API:** `output_text`, `choices[0].message.content`, or `output`
- **Chat Completions API:** `choices[0].message.content`, `choices[0].text`, `content`, `message.content`

## Usage Tracking

Both APIs now track usage consistently:
```typescript
const usageStats = extractUsageStats(completion);
// Returns: { tokensUsed: number, api: "responses" | "chat_completions" }
```

Result payloads now include:
```typescript
{
  model: "gpt-5",
  api: "responses",  // New field
  tokensUsed: 300,
  // ...
}
```

## Testing

- ✅ All existing tests pass
- ✅ Quiz generation tests verify hybrid API routing
- ✅ Topic question generation uses same underlying client

## Migration Notes

**No breaking changes:**
- API endpoint remains the same: `POST /api/admin/topics/[id]/ai/generate-questions`
- Request/response formats unchanged
- Additional metadata field (`api`) added to results

**Benefits:**
- ✅ Automatic support for GPT-5 models
- ✅ Proper parameter usage for all models
- ✅ Consistent behavior with quiz generation
- ✅ Better error messages

## Future Enhancements

Potential improvements:
1. Add progress tracking for topic question generation (similar to quiz generation)
2. Add retry logic logging/metrics
3. Make reasoning effort and verbosity configurable
4. Add A/B testing between APIs for GPT-5

## Related Documentation

- `docs/AI_HYBRID_API_IMPLEMENTATION.md` - Detailed hybrid API guide
- `docs/AI_API_COMPARISON.md` - API comparison and rationale

