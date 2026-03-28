jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin_1", role: "ADMIN" }),
}));

jest.mock("@/lib/services/topic-content/pipeline.service", () => ({
  getTopicContentStatus: jest.fn().mockResolvedValue({
    topic: { id: "topic_123", contentStatus: "DRAFT", indexEligible: false },
    hasReadySnapshot: false,
    sourceDocumentCount: 5,
    distinctSourceCount: 2,
    claimCount: 40,
  }),
}));

import { GET } from "@/app/api/admin/topics/[id]/content/status/route";

describe("GET /api/admin/topics/[id]/content/status", () => {
  it("returns additive distinctSourceCount metric", async () => {
    const response = await GET({} as any, { params: Promise.resolve({ id: "topic_123" }) });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.sourceDocumentCount).toBe(5);
    expect(body.data.distinctSourceCount).toBe(2);
  });
});
