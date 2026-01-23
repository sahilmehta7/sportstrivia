import { generateTopicMetadataAI, generateQuizMetadataAI } from "@/lib/services/ai-seo.service";
import { callOpenAIWithRetry } from "@/lib/services/ai-openai-client.service";

// Mock the OpenAI client
jest.mock("@/lib/services/ai-openai-client.service", () => ({
    callOpenAIWithRetry: jest.fn(),
    extractContentFromCompletion: jest.fn((completion) => completion.choices[0].message.content),
}));

// Mock the settings service
jest.mock("@/lib/services/settings.service", () => ({
    getAIModel: jest.fn().mockResolvedValue("gpt-4o"),
}));

describe("AI SEO Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("generateTopicMetadataAI", () => {
        it("should generate topic metadata correctly", async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                title: "Ultimate Cricket Legends: The Untold Records & Stories",
                                description: "Think you know cricket? Discover the elite records and historic moments that shaped the game's legends. Dive into our masterclass now!",
                                keywords: ["cricket", "legends", "records", "stats", "history", "ultimate"],
                            }),
                        },
                    },
                ],
            };

            (callOpenAIWithRetry as jest.Mock).mockResolvedValue(mockResponse);

            const result = await generateTopicMetadataAI("Cricket", "A topic about cricket history");

            expect(result).toEqual({
                title: "Ultimate Cricket Legends: The Untold Records & Stories",
                description: "Think you know cricket? Discover the elite records and historic moments that shaped the game's legends. Dive into our masterclass now!",
                keywords: ["cricket", "legends", "records", "stats", "history", "ultimate"],
            });
            expect(callOpenAIWithRetry).toHaveBeenCalled();
        });

        it("should return fallback values on failure", async () => {
            (callOpenAIWithRetry as jest.Mock).mockRejectedValue(new Error("AI error"));

            const result = await generateTopicMetadataAI("Cricket");

            expect(result).toBeNull();
        });
    });

    describe("generateQuizMetadataAI", () => {
        it("should generate quiz metadata correctly", async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                title: "The Ultimate Virat Kohli Quiz: Only 1% Can Pass",
                                description: "Think you're a true King Kohli fan? Prove it by tackling the most advanced trivia challenge online. Play now and claim your rank!",
                                keywords: ["virat kohli", "quiz", "trivia", "challenge", "king kohli", "stats"],
                            }),
                        },
                    },
                ],
            };

            (callOpenAIWithRetry as jest.Mock).mockResolvedValue(mockResponse);

            const result = await generateQuizMetadataAI("Virat Kohli Quiz", "A quiz about Virat Kohli");

            expect(result).toEqual({
                title: "The Ultimate Virat Kohli Quiz: Only 1% Can Pass",
                description: "Think you're a true King Kohli fan? Prove it by tackling the most advanced trivia challenge online. Play now and claim your rank!",
                keywords: ["virat kohli", "quiz", "trivia", "challenge", "king kohli", "stats"],
            });
            expect(callOpenAIWithRetry).toHaveBeenCalled();
        });
    });
});
