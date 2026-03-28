/** @jest-environment node */

jest.mock("@/lib/db", () => {
  const prisma = {
    topic: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { prisma };
});

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { PATCH, DELETE } from "@/app/api/admin/topics/[id]/route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

describe("Topics route sitemap invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
  });

  it("invalidates sitemap when slug changes for an index-eligible topic", async () => {
    (prisma.topic.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.slug) return Promise.resolve(null);
      return Promise.resolve({
        id: "topic_1",
        name: "Old Name",
        slug: "old-slug",
        level: 0,
        indexEligible: true,
        schemaType: "NONE",
        schemaCanonicalUrl: null,
        schemaSameAs: [],
        alternateNames: [],
        schemaEntityData: null,
      });
    });

    (prisma.topic.update as jest.Mock).mockResolvedValue({
      id: "topic_1",
      name: "Old Name",
      slug: "new-slug",
      indexEligible: true,
      parent: null,
      children: [],
      _count: { questions: 0, children: 0, quizTopicConfigs: 0 },
    });

    const request = { json: jest.fn().mockResolvedValue({ slug: "new-slug" }) } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: "topic_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("invalidates sitemap when deleting an index-eligible topic", async () => {
    (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
      id: "topic_1",
      indexEligible: true,
      _count: { questions: 0, children: 0, quizTopicConfigs: 0 },
    });
    (prisma.topic.delete as jest.Mock).mockResolvedValue({ id: "topic_1" });

    const response = await DELETE({} as any, { params: Promise.resolve({ id: "topic_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
