jest.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    constructor(_config: unknown) {}
    static slidingWindow(_requests: number, _window: string) {
      return {};
    }
    async limit(_identifier: string) {
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      };
    }
  }
  return { Ratelimit: MockRatelimit };
});

jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({}),
  },
}));

describe("rate-limit production behavior", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("fails closed for strict checks when Redis is unavailable in production", async () => {
    const mod = await import("@/lib/rate-limit");
    const result = await mod.checkRateLimitStrict("user-1", mod.searchRateLimiter);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses bounded in-memory fallback for non-strict checks in production", async () => {
    const mod = await import("@/lib/rate-limit");
    const limiter = {
      limit: async () => {
        throw new Error("redis down");
      },
    } as any;

    const first = await mod.checkRateLimit("user-2", limiter, {
      maxRequests: 1,
      windowMs: 60000,
    });
    const second = await mod.checkRateLimit("user-2", limiter, {
      maxRequests: 1,
      windowMs: 60000,
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
});
