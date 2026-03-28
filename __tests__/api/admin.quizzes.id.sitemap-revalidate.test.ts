/** @jest-environment node */

jest.mock("@/lib/db", () => {
  const prisma = {
    quiz: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma };
});

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/validations/quiz.schema", () => ({
  quizUpdateSchema: { parse: jest.fn() },
}));

jest.mock("@/lib/seo-utils", () => ({
  generateUniqueSlug: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { PUT } from "@/app/api/admin/quizzes/[id]/route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { quizUpdateSchema } from "@/lib/validations/quiz.schema";
import { revalidatePath } from "next/cache";

describe("PUT /api/admin/quizzes/[id] sitemap invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "old-slug",
      title: "Old title",
      isPublished: false,
      status: "DRAFT",
      recurringType: "NONE",
      maxAttemptsPerUser: null,
      attemptResetPeriod: "NEVER",
    });
    (prisma.quiz.update as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "old-slug",
      isPublished: true,
      status: "PUBLISHED",
      _count: { questionPool: 0, attempts: 0 },
    });
  });

  it("revalidates sitemap when a quiz becomes published", async () => {
    (quizUpdateSchema.parse as jest.Mock).mockReturnValue({
      status: "PUBLISHED",
      isPublished: true,
    });

    const request = { json: jest.fn().mockResolvedValue({}) } as any;
    const response = await PUT(request, { params: Promise.resolve({ id: "quiz_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("does not revalidate sitemap when eligibility and slug do not change", async () => {
    (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "same-slug",
      title: "Same",
      isPublished: true,
      status: "PUBLISHED",
      recurringType: "NONE",
      maxAttemptsPerUser: null,
      attemptResetPeriod: "NEVER",
    });
    (prisma.quiz.update as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      slug: "same-slug",
      isPublished: true,
      status: "PUBLISHED",
      _count: { questionPool: 0, attempts: 0 },
    });
    (quizUpdateSchema.parse as jest.Mock).mockReturnValue({
      description: "metadata-only update",
    });

    const request = { json: jest.fn().mockResolvedValue({}) } as any;
    const response = await PUT(request, { params: Promise.resolve({ id: "quiz_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
