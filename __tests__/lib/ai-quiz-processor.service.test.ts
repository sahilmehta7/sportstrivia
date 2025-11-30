import { processAIQuizTask, buildPrompt, extractJSON, determineSportFromTopic, fetchSourceMaterial } from "@/lib/services/ai-quiz-processor.service";
import { BackgroundTaskType } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/services/background-task.service", () => ({
  getBackgroundTaskById: jest.fn(),
  markBackgroundTaskInProgress: jest.fn(),
  markBackgroundTaskCompleted: jest.fn(),
  markBackgroundTaskFailed: jest.fn(),
  updateTaskProgress: jest.fn(),
  updateBackgroundTask: jest.fn(),
}));

jest.mock("@/lib/services/settings.service", () => ({
  getAIQuizPrompt: jest.fn(),
  getAIModel: jest.fn(),
}));

const {
  getBackgroundTaskById,
  markBackgroundTaskInProgress,
  markBackgroundTaskCompleted,
  markBackgroundTaskFailed,
  updateTaskProgress,
  updateBackgroundTask: _updateBackgroundTask,
} = require("@/lib/services/background-task.service");

const { getAIQuizPrompt, getAIModel } = require("@/lib/services/settings.service");

describe("ai-quiz-processor.service", () => {
  const mockTaskId = "task_123";
  const mockTask = {
    id: mockTaskId,
    type: BackgroundTaskType.AI_QUIZ_GENERATION,
    input: {
      topic: "Basketball",
      effectiveTopic: "Basketball",
      quizSport: "Basketball",
      difficulty: "MEDIUM",
      numQuestions: 5,
      customTitle: null,
      sourceUrl: null,
      sourceMaterial: null,
    },
  };

  // Mock response for Chat Completions API
  const mockChatCompletionsResponse = {
    id: "chatcmpl-123",
    object: "chat.completion",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            title: "Basketball Quiz",
            difficulty: "MEDIUM",
            questions: [
              {
                question: "Who won the NBA championship in 2020?",
                options: ["Lakers", "Heat", "Celtics", "Warriors"],
                correctAnswer: 0,
                difficulty: "MEDIUM",
              },
            ],
          }),
        },
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 200,
      total_tokens: 300,
    },
  };

  // Mock response for Responses API
  const mockResponsesAPIResponse = {
    id: "resp-123",
    object: "response",
    model: "gpt-5",
    output_text: JSON.stringify({
      title: "Basketball Quiz",
      difficulty: "MEDIUM",
      questions: [
        {
          question: "Who won the NBA championship in 2020?",
          options: ["Lakers", "Heat", "Celtics", "Warriors"],
          correctAnswer: 0,
          difficulty: "MEDIUM",
        },
      ],
    }),
    usage: {
      prompt_tokens: 100,
      completion_tokens: 200,
      total_tokens: 300,
    },
  };

  // Default to Chat Completions response (will be reassigned in beforeEach)
  let mockOpenAIResponse: typeof mockChatCompletionsResponse | typeof mockResponsesAPIResponse = mockChatCompletionsResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";

    // Setup default mocks
    getBackgroundTaskById.mockResolvedValue(mockTask);
    markBackgroundTaskInProgress.mockResolvedValue(undefined);
    markBackgroundTaskCompleted.mockResolvedValue(undefined);
    markBackgroundTaskFailed.mockResolvedValue(undefined);
    updateTaskProgress.mockResolvedValue(undefined);
    getAIQuizPrompt.mockResolvedValue("Create a quiz about {{TOPIC}} with {{NUM_QUESTIONS}} questions");
    getAIModel.mockResolvedValue("gpt-4o");

    // Mock global fetch - default to Chat Completions response
    // Tests can override this for specific scenarios
    mockOpenAIResponse = mockChatCompletionsResponse;
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenAIResponse),
      });
    });
  });

  describe("processAIQuizTask", () => {
    it("should process a valid task successfully", async () => {
      await processAIQuizTask(mockTaskId);

      expect(markBackgroundTaskInProgress).toHaveBeenCalledWith(mockTaskId);
      expect(getBackgroundTaskById).toHaveBeenCalledWith(mockTaskId);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          }),
        })
      );
      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
      expect(markBackgroundTaskFailed).not.toHaveBeenCalled();
    });

    it("should derive sport context when input sport is missing", async () => {
      getBackgroundTaskById.mockResolvedValue({
        ...mockTask,
        input: {
          ...mockTask.input,
          topic: "Super Bowl champions",
          effectiveTopic: "Super Bowl champions",
          quizSport: undefined,
          sport: "",
        },
      });

      await processAIQuizTask(mockTaskId);

      const completedCall = markBackgroundTaskCompleted.mock.calls[0];
      expect(completedCall[1].metadata.sport).toBe("Football");
    });

    it("should throw error if task not found", async () => {
      getBackgroundTaskById.mockResolvedValue(null);

      await expect(processAIQuizTask(mockTaskId)).rejects.toThrow("Task not found or missing input");
      expect(markBackgroundTaskFailed).toHaveBeenCalledWith(mockTaskId, expect.stringContaining("Task not found"));
    });

    it("should throw error if task type is incorrect", async () => {
      getBackgroundTaskById.mockResolvedValue({
        ...mockTask,
        type: BackgroundTaskType.AI_QUIZ_IMPORT,
      });

      await expect(processAIQuizTask(mockTaskId)).rejects.toThrow("Task is not an AI quiz generation task");
      expect(markBackgroundTaskFailed).toHaveBeenCalled();
    });

    it("should use Responses API with max_output_tokens for GPT-5 models", async () => {
      getAIModel.mockResolvedValue("gpt-5");

      // Mock Responses API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponsesAPIResponse),
      });

      await processAIQuizTask(mockTaskId);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should use Responses API endpoint
      expect(url).toBe("https://api.openai.com/v1/responses");
      expect(requestBody.max_output_tokens).toBe(16000);
      expect(requestBody.reasoning?.effort).toBe("medium");
      expect(requestBody.text?.verbosity).toBe("medium");
      expect(requestBody.input).toBeDefined();
      expect(requestBody.model).toBe("gpt-5");
      expect(requestBody.temperature).toBeUndefined();
      expect(requestBody.max_tokens).toBeUndefined();
      expect(requestBody.messages).toBeUndefined(); // Responses API uses 'input', not 'messages'
    });

    it("should use Chat Completions API with max_tokens for o1 models", async () => {
      getAIModel.mockResolvedValue("o1-preview");

      await processAIQuizTask(mockTaskId);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should use Chat Completions API endpoint (o1 is not GPT-5)
      expect(url).toBe("https://api.openai.com/v1/chat/completions");
      expect(requestBody.max_tokens).toBe(16000);
      expect(requestBody.max_output_tokens).toBeUndefined();
      expect(requestBody.temperature).toBeUndefined();
      expect(requestBody.response_format).toBeUndefined();
    });

    it("should use Chat Completions API with max_tokens and temperature for standard models", async () => {
      getAIModel.mockResolvedValue("gpt-4o");

      await processAIQuizTask(mockTaskId);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should use Chat Completions API endpoint
      expect(url).toBe("https://api.openai.com/v1/chat/completions");
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.max_output_tokens).toBeUndefined();
      expect(requestBody.temperature).toBe(0.8);
      expect(requestBody.response_format).toEqual({ type: "json_object" });
    });

    it("should retry on 429 rate limit errors", async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: jest.fn().mockResolvedValue({ error: { message: "Rate limit exceeded" } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(mockOpenAIResponse),
        });
      });

      await processAIQuizTask(mockTaskId);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
    });

    it("should retry on 5xx server errors", async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: jest.fn().mockResolvedValue({ error: { message: "Internal server error" } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(mockOpenAIResponse),
        });
      });

      await processAIQuizTask(mockTaskId);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
    });

    it("should fail after max retries", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ error: { message: "Rate limit exceeded" } }),
      });

      await expect(processAIQuizTask(mockTaskId)).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(3); // Max retries
      expect(markBackgroundTaskFailed).toHaveBeenCalled();
    });

    it("should handle JSON wrapped in markdown code blocks", async () => {
      const wrappedResponse = {
        ...mockChatCompletionsResponse,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "```json\n" +
                JSON.stringify({
                  title: "Test Quiz",
                  questions: [
                    {
                      questionText: "Wrapped?",
                      difficulty: "MEDIUM",
                      answers: [
                        { answerText: "A", isCorrect: true },
                        { answerText: "B", isCorrect: false },
                        { answerText: "C", isCorrect: false },
                        { answerText: "D", isCorrect: false },
                      ],
                    },
                  ],
                }) +
                "\n```",
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(wrappedResponse),
      });

      await processAIQuizTask(mockTaskId);

      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
    });

    it("should update progress during processing", async () => {
      await processAIQuizTask(mockTaskId);

      expect(updateTaskProgress).toHaveBeenCalledWith(mockTaskId, expect.objectContaining({ percentage: expect.any(Number) }));
    });

    it("should extract content from Responses API output_text field", async () => {
      getAIModel.mockResolvedValue("gpt-5");

      // Mock Responses API with output_text format
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: "resp-123",
          object: "response",
          model: "gpt-5",
          output_text: JSON.stringify({
            title: "Test Quiz",
            difficulty: "MEDIUM",
            questions: [{ question: "Test?", options: ["A"], correctAnswer: 0 }],
          }),
          usage: { total_tokens: 100 },
        }),
      });

      await processAIQuizTask(mockTaskId);

      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
      const completedCall = markBackgroundTaskCompleted.mock.calls[0];
      expect(completedCall[1]).toHaveProperty("quiz");
      expect(completedCall[1].quiz.title).toBe("Test Quiz");
    });

    it("should gracefully handle Responses API when output_text is an array", async () => {
      getAIModel.mockResolvedValue("gpt-5");

      // Simulate the real Responses API output_text structure (array of strings)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: "resp-456",
          object: "response",
          model: "gpt-5",
          output_text: [
            JSON.stringify({
              title: "Array Text Quiz",
              difficulty: "MEDIUM",
              questions: [
                {
                  questionText: "Sample?",
                  answers: [
                    { answerText: "A", isCorrect: true },
                    { answerText: "B", isCorrect: false },
                    { answerText: "C", isCorrect: false },
                    { answerText: "D", isCorrect: false },
                  ],
                  difficulty: "MEDIUM",
                },
              ],
            }),
          ],
          usage: { total_tokens: 120 },
        }),
      });

      await processAIQuizTask(mockTaskId);

      expect(markBackgroundTaskCompleted).toHaveBeenCalled();
      const completedCall = markBackgroundTaskCompleted.mock.calls[markBackgroundTaskCompleted.mock.calls.length - 1];
      expect(completedCall?.[1]?.quiz?.title).toBe("Array Text Quiz");
    });

    it("should read Responses API output when content is nested under output", async () => {
      getAIModel.mockResolvedValue("gpt-5");

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: "resp-789",
          object: "response",
          model: "gpt-5",
          output: [
            {
              id: "msg-1",
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    title: "Nested Output Quiz",
                    difficulty: "HARD",
                    questions: [
                      {
                        questionText: "Nested?",
                        difficulty: "HARD",
                        answers: [
                          { answerText: "Yes", isCorrect: true },
                          { answerText: "No", isCorrect: false },
                          { answerText: "Maybe", isCorrect: false },
                          { answerText: "Later", isCorrect: false },
                        ],
                      },
                    ],
                  }),
                },
              ],
            },
          ],
          usage: { total_tokens: 180 },
        }),
      });

      await processAIQuizTask(mockTaskId);
      const completedCall = markBackgroundTaskCompleted.mock.calls[0];
      expect(completedCall[1].quiz.title).toBe("Nested Output Quiz");
      expect(completedCall[1].quiz.questions[0].difficulty).toBe("HARD");
    });
  });

  describe("buildPrompt", () => {
    it("should replace all placeholders", () => {
      const template = "Quiz about {{TOPIC}} ({{TOPIC_LOWER}}) for {{SPORT}} with {{NUM_QUESTIONS}} questions, difficulty {{DIFFICULTY}}";
      const result = buildPrompt(template, "Basketball", "Basketball", "MEDIUM", 5, "basketball");
      
      expect(result).toContain("Basketball");
      expect(result).toContain("basketball");
      expect(result).toContain("MEDIUM");
      expect(result).toContain("5");
      expect(result).not.toContain("{{");
    });

    it("should add custom title instruction", () => {
      const template = "Create quiz about {{TOPIC}}";
      const result = buildPrompt(template, "Basketball", "Basketball", "MEDIUM", 5, "basketball", {
        customTitle: "NBA Championship Quiz",
      });
      
      expect(result).toContain("NBA Championship Quiz");
      expect(result).toContain('Set the quiz "title" field');
    });

    it("should add source material if provided", () => {
      const template = "Create quiz about {{TOPIC}}";
      const result = buildPrompt(template, "Basketball", "Basketball", "MEDIUM", 5, "basketball", {
        sourceMaterial: {
          url: "https://example.com",
          title: "Basketball History",
          contentSnippet: "The NBA was founded in 1946",
          derivedTopic: "Basketball",
        },
      });
      
      expect(result).toContain("https://example.com");
      expect(result).toContain("Basketball History");
      expect(result).toContain("The NBA was founded in 1946");
    });
  });

  describe("extractJSON", () => {
    it("should extract JSON from markdown code block", () => {
      const content = "```json\n{\"key\": \"value\"}\n```";
      const result = extractJSON(content);
      expect(result).toBe("{\"key\": \"value\"}");
    });

    it("should extract JSON without json marker", () => {
      const content = "```\n{\"key\": \"value\"}\n```";
      const result = extractJSON(content);
      expect(result).toBe("{\"key\": \"value\"}");
    });

    it("should extract JSON from plain text", () => {
      const content = "Here is some text {\"key\": \"value\"} and more text";
      const result = extractJSON(content);
      expect(result).toBe("{\"key\": \"value\"}");
    });

    it("should return original content if no JSON found", () => {
      const content = "No JSON here";
      const result = extractJSON(content);
      expect(result).toBe("No JSON here");
    });

    it("should extract JSON when there is trailing text after the JSON object", () => {
      const jsonWithTrailing = `{"title": "Test Quiz", "questions": []}This is some extra text after the JSON`;
      const result = extractJSON(jsonWithTrailing);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ title: "Test Quiz", questions: [] });
    });

    it("should extract JSON from text with leading and trailing text", () => {
      const mixedContent = `Here's some explanation: {"title": "Quiz", "questions": []} and here's more text after`;
      const result = extractJSON(mixedContent);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ title: "Quiz", questions: [] });
    });
  });

  describe("determineSportFromTopic", () => {
    it("should detect Cricket from topic", () => {
      expect(determineSportFromTopic("Cricket World Cup")).toBe("Cricket");
      expect(determineSportFromTopic("IPL 2024")).toBe("Cricket");
    });

    it("should detect Basketball from topic", () => {
      expect(determineSportFromTopic("NBA Finals")).toBe("Basketball");
      expect(determineSportFromTopic("Basketball legends")).toBe("Basketball");
    });

    it("should detect Football from topic", () => {
      expect(determineSportFromTopic("NFL Super Bowl")).toBe("Football");
    });

    it("should detect Soccer from topic", () => {
      expect(determineSportFromTopic("FIFA World Cup")).toBe("Soccer");
      expect(determineSportFromTopic("Premier League")).toBe("Soccer");
    });

    it("should return General for unknown topics", () => {
      expect(determineSportFromTopic("Random Sports Trivia")).toBe("General");
    });
  });

  describe("fetchSourceMaterial", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it("should fetch and parse source material successfully", async () => {
      const mockHtml = `
        <html>
          <head><title>Basketball History</title></head>
          <body><p>The NBA was founded in 1946</p></body>
        </html>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const result = await fetchSourceMaterial("https://example.com/basketball");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Basketball History");
      expect(result?.url).toBe("https://example.com/basketball");
      expect(result?.contentSnippet).toContain("NBA");
    });

    it("should handle fetch errors gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchSourceMaterial("https://example.com/not-found");

      expect(result).not.toBeNull();
      expect(result?.title).toBeNull();
      expect(result?.contentSnippet).toBe("");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await fetchSourceMaterial("https://example.com/error");

      expect(result).not.toBeNull();
      expect(result?.url).toContain("example.com");
    });
  });
});
