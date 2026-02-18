// Mock next/server
jest.mock("next/server", () => ({
    NextResponse: {
        json: jest.fn((body: any, init?: ResponseInit) => ({
            status: init?.status ?? 200,
            json: async () => body,
            ...init,
        })),
    },
    NextRequest: class {
        constructor(public url: string, public init?: any) { }
        async json() { return this.init?.body ? JSON.parse(this.init.body) : {}; }
    },
}));

jest.mock("@/lib/db", () => {
    const mockPrisma: any = {
        quiz: { findUnique: jest.fn() },
        topic: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
        question: { create: jest.fn() },
        quizQuestionPool: { create: jest.fn() },
        quizTopicConfig: { createMany: jest.fn() },
        $transaction: jest.fn((callback) => callback(mockPrisma)),
    };
    return { prisma: mockPrisma };
});

jest.mock("@/lib/auth-helpers", () => ({
    requireAdmin: jest.fn().mockResolvedValue({ id: "admin_123", role: "ADMIN" }),
}));

jest.mock("@/lib/services/slug.service", () => ({
    generateUniqueSlug: jest.fn().mockResolvedValue("mock-slug"),
}));

jest.mock("@/lib/services/quiz-topic-sync.service", () => ({
    syncTopicsFromQuestionPool: jest.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/admin/quizzes/[id]/import/route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { generateUniqueSlug } from "@/lib/services/slug.service";

describe("/api/admin/quizzes/[id]/import", () => {
    const quizId = "quiz_123";
    const mockQuiz = {
        id: quizId,
        title: "Test Quiz",
        _count: { questionPool: 0 },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
        (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: "topic_general", name: "General" });
        (prisma.topic.findMany as jest.Mock).mockResolvedValue([{ id: "topic_general", name: "General" }]);
        (prisma.topic.create as jest.Mock).mockResolvedValue({ id: "topic_created_default", name: "Created Topic" });
        (prisma.question.create as jest.Mock).mockResolvedValue({ id: "q_123" });
    });

    const createMockRequest = (body: any) => ({
        json: jest.fn().mockResolvedValue(body),
    } as any);

    it("should successfully import questions", async () => {
        const body = {
            questions: [
                {
                    text: "What is 2+2?",
                    difficulty: "EASY",
                    topic: "Math",
                    answers: [
                        { text: "4", isCorrect: true },
                        { text: "5", isCorrect: false },
                    ],
                },
            ],
        };

        const response = await POST(createMockRequest(body), { params: Promise.resolve({ id: quizId }) });
        const json = await (response as any).json();

        expect(response.status).toBe(201);
        expect(requireAdmin).toHaveBeenCalled();
        expect(prisma.quiz.findUnique).toHaveBeenCalled();
        expect(prisma.question.create).toHaveBeenCalled();
        expect(prisma.quizQuestionPool.create).toHaveBeenCalled();
        expect(json.data.importedCount).toBe(1);
    });

    it("should support case-insensitive difficulty", async () => {
        const body = {
            questions: [
                {
                    text: "Lowercase test",
                    difficulty: "easy",
                    topic: "Test",
                    answers: [
                        { text: "A", isCorrect: true },
                        { text: "B", isCorrect: false },
                    ],
                },
                {
                    text: "Mixed case test",
                    difficulty: "MeDiUm",
                    topic: "Test",
                    answers: [
                        { text: "A", isCorrect: true },
                        { text: "B", isCorrect: false },
                    ],
                },
            ],
        };

        const response = await POST(createMockRequest(body), { params: Promise.resolve({ id: quizId }) });
        const json = await (response as any).json();

        if (response.status !== 201) {
            console.error('FAIL RESPONSE STATUS:', response.status);
            console.error('FAIL RESPONSE BODY:', JSON.stringify(json, null, 2));
        }

        expect(response.status).toBe(201);
        expect(json.data?.importedCount).toBe(2);
        expect(prisma.question.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ difficulty: "EASY" })
        }));
        expect(prisma.question.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ difficulty: "MEDIUM" })
        }));
    });

    it("should create missing topics during import", async () => {
        (prisma.topic.findMany as jest.Mock).mockResolvedValue([]); // No matching topics
        (prisma.topic.create as jest.Mock).mockResolvedValue({ id: "topic_new", name: "Science" });

        const body = {
            questions: [
                {
                    text: "What is H2O?",
                    difficulty: "MEDIUM",
                    topic: "Science",
                    answers: [
                        { text: "Water", isCorrect: true },
                        { text: "Oil", isCorrect: false },
                    ],
                },
            ],
        };

        const response = await POST(createMockRequest(body), { params: Promise.resolve({ id: quizId }) });
        expect(response.status).toBe(201);

        expect(generateUniqueSlug).toHaveBeenCalledWith("Science", "topic");
        expect(prisma.topic.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ name: "Science" })
        }));
    });

    it("should return 404 if quiz not found", async () => {
        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

        const body = {
            questions: [
                {
                    text: "Valid text",
                    difficulty: "EASY",
                    answers: [
                        { text: "A", isCorrect: true },
                        { text: "B", isCorrect: false },
                    ],
                },
            ],
        };
        const response = await POST(createMockRequest(body), { params: Promise.resolve({ id: "invalid_id" }) });
        const json = await (response as any).json();

        expect(response.status).toBe(404);
        expect(json.error).toBe("Quiz not found");
    });

    it("should return 400 for invalid input", async () => {
        const body = {
            questions: [
                {
                    text: "", // Invalid: empty
                    difficulty: "INVALID", // Invalid enum
                    answers: [], // Invalid: too few
                },
            ],
        };

        const response = await POST(createMockRequest(body), { params: Promise.resolve({ id: quizId }) });
        const json = await (response as any).json();

        expect(response.status).toBe(400);
        expect(json.error).toBe("Validation failed");
    });
});
