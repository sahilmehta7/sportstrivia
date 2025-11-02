import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Check if Redis is configured
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Create a no-op rate limiter for development when Redis is not configured
const noOpRateLimiter = {
  limit: async () => ({
    success: true,
    limit: Infinity,
    remaining: Infinity,
    reset: Date.now() + 60000,
  }),
} as unknown as Ratelimit;

// Helper to create rate limiters with fallback
function createRateLimiter(requests: number, window: string): Ratelimit {
  if (isRedisConfigured()) {
    try {
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
      });
    } catch (error) {
      console.warn("[rate-limit] Failed to initialize rate limiter, using no-op:", error);
      return noOpRateLimiter;
    }
  }
  
  // Without Redis, use no-op limiter (works in both dev and production)
  // This prevents build errors when Redis is not configured
  console.warn("[rate-limit] Redis not configured, using no-op rate limiter");
  return noOpRateLimiter;
}

// Create rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(10, "1 m"); // 10 requests per minute
export const apiRateLimiter = createRateLimiter(100, "1 m"); // 100 requests per minute
export const adminRateLimiter = createRateLimiter(50, "1 m"); // 50 requests per minute
export const searchRateLimiter = createRateLimiter(30, "1 m"); // 30 search requests per minute
export const searchSuggestionsRateLimiter = createRateLimiter(60, "1 m"); // 60 suggestion requests per minute

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    // If rate limiting fails (e.g., Redis unavailable), allow the request in development
    if (process.env.NODE_ENV === "development") {
      console.warn("[rate-limit] Rate limiting failed, allowing request:", error);
      return { success: true, limit: Infinity, remaining: Infinity, reset: Date.now() + 60000 };
    }
    
    // In production, log error but allow request (fail open for availability)
    console.error("[rate-limit] Rate limiting error:", error);
    return { success: true, limit: Infinity, remaining: Infinity, reset: Date.now() + 60000 };
  }
}

