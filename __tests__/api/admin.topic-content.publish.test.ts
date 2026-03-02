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
  runTopicPublish: jest.fn().mockResolvedValue({ id: "snapshot_1" }),
}));

import { POST } from "@/app/api/admin/topics/[id]/content/publish/route";

describe("POST /api/admin/topics/[id]/content/publish", () => {
  it("publishes ready snapshot", async () => {
    const response = await POST({} as any, { params: Promise.resolve({ id: "topic_abc" }) });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("PUBLISHED");
    expect(body.data.topicId).toBe("topic_abc");
  });
});
