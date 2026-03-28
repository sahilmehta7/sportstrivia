/** @jest-environment node */

import { POST } from "@/app/api/admin/topics/[id]/merge/route";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { mergeTopics, getDescendantTopicIds } from "@/lib/services/topic.service";
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

jest.mock("@/lib/services/topic.service", () => ({
  mergeTopics: jest.fn(),
  getDescendantTopicIds: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("POST /api/admin/topics/[id]/merge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (getDescendantTopicIds as jest.Mock).mockResolvedValue([]);
    (mergeTopics as jest.Mock).mockResolvedValue({ success: true });
  });

  it("invalidates sitemap when source topic is index-eligible", async () => {
    (prisma.topic.findUnique as jest.Mock).mockResolvedValue({ indexEligible: true });

    const request = {
      json: jest.fn().mockResolvedValue({ destinationId: "cm12345678901234567890123" }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({ id: "cm00000000000000000000001" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate sitemap when source topic is not index-eligible", async () => {
    (prisma.topic.findUnique as jest.Mock).mockResolvedValue({ indexEligible: false });

    const request = {
      json: jest.fn().mockResolvedValue({ destinationId: "cm12345678901234567890123" }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({ id: "cm00000000000000000000001" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
