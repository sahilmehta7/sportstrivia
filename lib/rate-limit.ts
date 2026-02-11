import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// In-memory rate limit store as fallback when Redis is unavailable
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupInMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }
  lastCleanup = now;
}

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

// In production, force callers into explicit fallback behavior when Redis is unavailable.
const unavailableRateLimiter = {
  limit: async () => {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  },
} as unknown as Ratelimit;

// Helper to create rate limiters with fallback
function createRateLimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit {
  if (isRedisConfigured()) {
    try {
      return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[rate-limit] Failed to initialize rate limiter, using no-op:", error);
        return noOpRateLimiter;
      }
      console.error("[rate-limit] Failed to initialize rate limiter in production:", error);
      return unavailableRateLimiter;
    }
  }

  // Without Redis, only development can run fail-open.
  if (process.env.NODE_ENV === "development") {
    console.warn("[rate-limit] Redis not configured, using no-op rate limiter");
    return noOpRateLimiter;
  }
  console.error("[rate-limit] Redis not configured in production; enabling fail-safe behavior");
  return unavailableRateLimiter;
}

// Create rate limiters for different endpoints
export const authRateLimiter = createRateLimiter(10, "1 m"); // 10 requests per minute
export const apiRateLimiter = createRateLimiter(100, "1 m"); // 100 requests per minute
export const adminRateLimiter = createRateLimiter(50, "1 m"); // 50 requests per minute
export const searchRateLimiter = createRateLimiter(30, "1 m"); // 30 search requests per minute
export const searchSuggestionsRateLimiter = createRateLimiter(60, "1 m"); // 60 suggestion requests per minute

/**
 * Check rate limit with in-memory fallback
 * 
 * When Redis fails:
 * - Development: Allow all requests (fail open)
 * - Production: Use in-memory fallback with same limits
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit,
  fallbackConfig?: { maxRequests: number; windowMs: number }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    // If rate limiting fails (e.g., Redis unavailable)
    if (process.env.NODE_ENV === "development") {
      // In development, just allow the request
      console.warn("[rate-limit] Rate limiting failed, allowing request:", error);
      return { success: true, limit: Infinity, remaining: Infinity, reset: Date.now() + 60000 };
    }

    // In production, use in-memory fallback to maintain some rate limiting
    console.warn("[rate-limit] Redis failed, using in-memory fallback:", error);
    return checkInMemoryRateLimit(identifier, fallbackConfig);
  }
}

/**
 * In-memory rate limiting fallback for when Redis is unavailable
 */
function checkInMemoryRateLimit(
  identifier: string,
  config?: { maxRequests: number; windowMs: number }
): { success: boolean; limit: number; remaining: number; reset: number } {
  // Cleanup old entries periodically
  cleanupInMemoryStore();

  const maxRequests = config?.maxRequests ?? 100;
  const windowMs = config?.windowMs ?? 60000;
  const now = Date.now();

  const entry = inMemoryStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limited
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: entry.resetAt
    };
  }

  // Increment and allow
  entry.count++;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetAt
  };
}

/**
 * Stricter rate limit check that fails closed (denies on error)
 * Use for sensitive endpoints like authentication
 */
export async function checkRateLimitStrict(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("[rate-limit] Strict check failed, denying request:", error);
    // Fail closed - deny the request if we can't verify rate limit
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000
    };
  }
}
