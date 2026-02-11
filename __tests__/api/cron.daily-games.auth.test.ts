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

import { GET } from "@/app/api/cron/daily-games/route";

jest.mock("@/lib/services/daily-game.service", () => ({
  getScheduledGames: jest.fn().mockResolvedValue([]),
  upsertDailyGame: jest.fn().mockResolvedValue(null),
}));

const buildRequest = (authorization: string | null) =>
  ({
    headers: {
      get: (key: string) => (key === "authorization" ? authorization : null),
    },
  } as any);

const buildSpoofedVercelRequest = () =>
  ({
    headers: {
      get: (key: string) => (key === "x-vercel-cron" ? "1" : null),
    },
  } as any);

describe("/api/cron/daily-games auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = "secret_123";
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects when bearer secret is missing", async () => {
    const response = await GET(buildRequest(null));
    expect(response.status).toBe(401);
  });

  it("rejects when bearer secret is invalid", async () => {
    const response = await GET(buildRequest("Bearer wrong"));
    expect(response.status).toBe(401);
  });

  it("rejects spoofed x-vercel-cron header without bearer secret", async () => {
    const response = await GET(buildSpoofedVercelRequest());
    expect(response.status).toBe(401);
  });

  it("accepts when bearer secret is valid", async () => {
    const response = await GET(buildRequest("Bearer secret_123"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
