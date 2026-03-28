/** @jest-environment node */

jest.mock("@/lib/db", () => {
  const prisma = {
    quiz: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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

import { DELETE } from "@/app/api/admin/quizzes/[id]/route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

describe("DELETE /api/admin/quizzes/[id] sitemap invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (prisma.quiz.update as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      status: "ARCHIVED",
      isPublished: false,
    });
  });

  it("invalidates sitemap when archiving a published quiz", async () => {
    (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      status: "PUBLISHED",
      isPublished: true,
    });

    const response = await DELETE({} as any, { params: Promise.resolve({ id: "quiz_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate sitemap when archiving a non-published quiz", async () => {
    (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
      id: "quiz_1",
      status: "DRAFT",
      isPublished: false,
    });

    const response = await DELETE({} as any, { params: Promise.resolve({ id: "quiz_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
