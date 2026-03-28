/** @jest-environment node */

import { POST } from "@/app/api/admin/topics/[id]/content/generate/route";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { runTopicGenerationAndScoring } from "@/lib/services/topic-content/pipeline.service";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/topic-content/pipeline.service", () => ({
  runTopicGenerationAndScoring: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("POST /api/admin/topics/[id]/content/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (runTopicGenerationAndScoring as jest.Mock).mockResolvedValue({
      snapshot: { id: "snapshot_1" },
      score: { passed: true },
    });
  });

  it("invalidates sitemap when indexEligible changes", async () => {
    (prisma.topic.findUnique as jest.Mock)
      .mockResolvedValueOnce({ indexEligible: false })
      .mockResolvedValueOnce({ indexEligible: true });

    const response = await POST({} as any, { params: Promise.resolve({ id: "topic_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate sitemap when indexEligible is unchanged", async () => {
    (prisma.topic.findUnique as jest.Mock)
      .mockResolvedValueOnce({ indexEligible: true })
      .mockResolvedValueOnce({ indexEligible: true });

    const response = await POST({} as any, { params: Promise.resolve({ id: "topic_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
