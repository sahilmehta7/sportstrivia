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

jest.mock("@/lib/jobs/topic-content-refresh.job", () => ({
  runTopicContentRefreshJob: jest.fn().mockResolvedValue({ processed: 1, failed: 0, topics: [] }),
}));

import { GET } from "@/app/api/cron/topic-content-refresh/route";

const buildRequest = (authorization: string | null) =>
  ({
    headers: {
      get: (key: string) => (key === "authorization" ? authorization : null),
    },
    url: "https://example.com/api/cron/topic-content-refresh?limit=20",
  } as any);

describe("/api/cron/topic-content-refresh auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = "secret_123";
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects missing bearer secret", async () => {
    const response = await GET(buildRequest(null));
    expect(response.status).toBe(401);
  });

  it("accepts valid bearer secret", async () => {
    const response = await GET(buildRequest("Bearer secret_123"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
