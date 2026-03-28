/** @jest-environment node */

jest.mock("@/lib/db", () => {
  const prisma = {
    quiz: {
      create: jest.fn(),
    },
  };
  return { prisma };
});

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/validations/quiz.schema", () => ({
  quizSchema: { parse: jest.fn() },
}));

jest.mock("@/lib/services/slug.service", () => ({
  generateUniqueSlug: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { POST } from "@/app/api/admin/quizzes/route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizSchema } from "@/lib/validations/quiz.schema";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import { revalidatePath } from "next/cache";

describe("POST /api/admin/quizzes sitemap invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (quizSchema.parse as jest.Mock).mockReturnValue({
      title: "Quiz title",
      status: "PUBLISHED",
      isPublished: true,
    });
    (generateUniqueSlug as jest.Mock).mockResolvedValue("quiz-title");
  });

  it("invalidates sitemap when creating a published quiz", async () => {
    (prisma.quiz.create as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "quiz-title",
      status: "PUBLISHED",
      isPublished: true,
      _count: { questionPool: 0 },
    });

    const request = { json: jest.fn().mockResolvedValue({}) } as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate sitemap when creating an unpublished quiz", async () => {
    (quizSchema.parse as jest.Mock).mockReturnValue({
      title: "Quiz title",
      status: "DRAFT",
      isPublished: false,
    });
    (prisma.quiz.create as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "quiz-title",
      status: "DRAFT",
      isPublished: false,
      _count: { questionPool: 0 },
    });

    const request = { json: jest.fn().mockResolvedValue({}) } as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
