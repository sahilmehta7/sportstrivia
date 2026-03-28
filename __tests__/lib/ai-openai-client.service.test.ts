import { callOpenAIWithRetry, TaskCancelledError } from "@/lib/services/ai-openai-client.service";
import { clearAIResponseCache } from "@/lib/services/ai-response-cache";

describe("ai-openai-client.service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearAIResponseCache();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("routes GPT-5 models to Responses API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        object: "response",
        output_text: "{\"ok\":true}",
        usage: { total_tokens: 42, prompt_tokens: 20, output_tokens: 22 },
      }),
    } as any);

    const completion = await callOpenAIWithRetry("gpt-5", "prompt", "system");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
    expect(completion._codexMeta.api).toBe("responses");
  });

  it("routes non GPT-5 models to Chat Completions API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        object: "chat.completion",
        choices: [{ message: { content: "{\"ok\":true}" } }],
        usage: { total_tokens: 40, prompt_tokens: 20, completion_tokens: 20 },
      }),
    } as any);

    const completion = await callOpenAIWithRetry("gpt-4o", "prompt", "system");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(completion._codexMeta.api).toBe("chat_completions");
  });

  it("falls back to cheaper model when budget blocks primary model", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        object: "chat.completion",
        choices: [{ message: { content: "{\"ok\":true}" } }],
        usage: { total_tokens: 30, prompt_tokens: 10, completion_tokens: 20 },
      }),
    } as any);

    const completion = await callOpenAIWithRetry(
      "gpt-5",
      "prompt",
      "system",
      {
        maxTokens: 1000,
        budgetPolicy: {
          maxEstimatedCostUsd: 0.005,
          fallbackModels: ["gpt-4o-mini"],
          hardFailOnExceed: true,
        },
      }
    );

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.model).toBe("gpt-4o-mini");
    expect(completion._codexMeta.fallbackUsed).toBe(true);
  });

  it("aborts before API call when cancellation check returns true", async () => {
    global.fetch = jest.fn();
    await expect(
      callOpenAIWithRetry("gpt-4o", "prompt", "system", {
        cancellationCheck: async () => true,
      })
    ).rejects.toBeInstanceOf(TaskCancelledError);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
