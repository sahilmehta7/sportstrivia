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
  runTopicIngestionPipeline: jest.fn().mockResolvedValue({
    collect: { inserted: 3, skipped: 1 },
    normalize: { inserted: 10, skipped: 2 },
    verify: { selected: 8, contradicted: 2, totalClaims: 10 },
  }),
}));

import { POST } from "@/app/api/admin/topics/[id]/content/ingest/route";

describe("POST /api/admin/topics/[id]/content/ingest", () => {
  it("runs topic ingestion pipeline with parsed mode", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ mode: "refresh", force: true }),
    } as any;

    const response = await POST(req, { params: Promise.resolve({ id: "topic_123" }) });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.mode).toBe("refresh");
    expect(body.data.topicId).toBe("topic_123");
  });
});
