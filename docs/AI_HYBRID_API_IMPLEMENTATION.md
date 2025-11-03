# Hybrid API Implementation: Responses API + Chat Completions

## Overview

The AI quiz generator now uses a **hybrid approach** that automatically selects the optimal OpenAI API based on the model being used:

- **GPT-5 models**: Uses **Responses API** (`/v1/responses`)
  - Better parameter support (`max_output_tokens`, `reasoning_effort`, `verbosity`)
  - Optimized for reasoning models
  
- **Other models** (GPT-4, GPT-4o, GPT-3.5-turbo, o1): Uses **Chat Completions API** (`/v1/chat/completions`)
  - Mature, stable API
  - Works with all non-GPT-5 models

## Implementation Details

### Architecture

```
callOpenAIWithRetry()
    ├─→ isGPT5?
    │   ├─→ YES → callResponsesAPIWithRetry()
    │   │           └─→ /v1/responses
    │   │           └─→ max_output_tokens, reasoning.effort, text.verbosity
    │   │
    │   └─→ NO  → callChatCompletionsAPIWithRetry()
    │               └─→ /v1/chat/completions
    │               └─→ max_tokens, temperature, response_format
```

### Code Structure

**Main Router:**
```typescript
async function callOpenAIWithRetry(aiModel: string, prompt: string): Promise<any> {
  const isGPT5 = aiModel.startsWith("gpt-5");
  
  if (isGPT5) {
    return await callResponsesAPIWithRetry(aiModel, prompt);
  } else {
    return await callChatCompletionsAPIWithRetry(aiModel, prompt);
  }
}
```

**Responses API Handler:**
```typescript
async function callResponsesAPIWithRetry(aiModel: string, prompt: string): Promise<any> {
  const requestBody = {
    model: aiModel,
    input: `${systemMessage}\n\n${prompt}`, // Single string input
    reasoning: { effort: "medium" },
    text: { verbosity: "medium" },
    max_output_tokens: 16000,
  };
  
  return await fetch("https://api.openai.com/v1/responses", { ... });
}
```

**Chat Completions API Handler:**
```typescript
async function callChatCompletionsAPIWithRetry(aiModel: string, prompt: string): Promise<any> {
  const requestBody = {
    model: aiModel,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
    max_tokens: isO1 ? 16000 : 4000,
    temperature: isO1 ? undefined : 0.8,
    response_format: isO1 ? undefined : { type: "json_object" },
  };
  
  return await fetch("https://api.openai.com/v1/chat/completions", { ... });
}
```

## Request Format Differences

### Responses API (GPT-5)
```json
{
  "model": "gpt-5",
  "input": "System message + user prompt combined",
  "reasoning": {
    "effort": "medium"
  },
  "text": {
    "verbosity": "medium"
  },
  "max_output_tokens": 16000
}
```

### Chat Completions API (Other Models)
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.8,
  "max_tokens": 4000,
  "response_format": { "type": "json_object" }
}
```

## Response Format Differences

### Responses API Response
```json
{
  "id": "resp-123",
  "object": "response",
  "model": "gpt-5",
  "output_text": "{...quiz JSON...}",
  "usage": { "total_tokens": 300 }
}
```

### Chat Completions API Response
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "choices": [{
    "message": {
      "content": "{...quiz JSON...}"
    }
  }],
  "usage": { "total_tokens": 300 }
}
```

## Content Extraction

The `extractContentFromCompletion()` function handles both formats:

```typescript
function extractContentFromCompletion(completion: any): string {
  const isResponsesAPI = 
    completion.object === "response" || 
    completion.object === "response_completion" ||
    completion.hasOwnProperty("output_text");
  
  if (isResponsesAPI) {
    // Try: output_text → choices[0].message.content → output
    return completion.output_text || 
           completion.choices?.[0]?.message?.content || 
           completion.output;
  } else {
    // Try: choices[0].message.content → choices[0].text → content → message.content
    return completion.choices?.[0]?.message?.content || 
           completion.choices?.[0]?.text || 
           completion.content || 
           completion.message?.content;
  }
}
```

## Parameter Mapping

| Feature | Responses API (GPT-5) | Chat Completions API (Others) |
|---------|----------------------|-------------------------------|
| Token Limit | `max_output_tokens` | `max_tokens` |
| Reasoning Control | `reasoning.effort` | Not available |
| Verbosity Control | `text.verbosity` | Not available |
| Temperature | Not supported | `temperature: 0.8` |
| JSON Mode | Not supported | `response_format: { type: "json_object" }` |
| Input Format | `input` (string) | `messages` (array) |

## Model Detection

```typescript
const isGPT5 = aiModel.startsWith("gpt-5");
const isO1 = aiModel.startsWith("o1");
```

**GPT-5 models:** `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
**O1 models:** `o1`, `o1-preview`, `o1-mini`
**Standard models:** `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`

## Benefits

### For GPT-5 Models
- ✅ **Proper token control**: `max_output_tokens` instead of `max_tokens`
- ✅ **Reasoning control**: Adjust `reasoning.effort` (minimal/low/medium/high)
- ✅ **Verbosity control**: Adjust `text.verbosity` (low/medium/high)
- ✅ **Optimized for reasoning**: Better suited for complex quiz generation

### For Other Models
- ✅ **Stable API**: Mature, well-documented
- ✅ **JSON mode**: Enforced structured output
- ✅ **Temperature control**: Fine-tune creativity
- ✅ **Backward compatible**: Existing functionality preserved

## Testing

All tests updated to verify:
- ✅ GPT-5 routes to Responses API
- ✅ Other models route to Chat Completions API
- ✅ Correct parameters for each API
- ✅ Response parsing handles both formats

## Error Handling

Both APIs share the same retry logic:
- Exponential backoff (1s, 2s, 4s delays)
- Retries on 429 (rate limit) and 5xx errors
- Max 3 attempts
- Clear error messages indicating which API failed

## Usage Tracking

Metadata now includes which API was used:
```typescript
metadata: {
  model: "gpt-5",
  api: "responses",  // or "chat_completions"
  tokensUsed: 300,
  // ...
}
```

## Migration Notes

- ✅ **Automatic**: No code changes needed - routing is automatic
- ✅ **Transparent**: Logs indicate which API is being used
- ✅ **Backward compatible**: Existing models continue to work
- ✅ **Future-ready**: New GPT-5 models automatically use Responses API

## Next Steps (Optional)

Potential enhancements:
1. Make `reasoning_effort` and `verbosity` configurable via settings
2. Add A/B testing between APIs for GPT-5
3. Monitor performance differences between APIs
4. Add fallback logic (e.g., if Responses API fails, try Chat Completions)

