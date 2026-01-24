import { createHash } from "crypto";

const AI_RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000;
const AI_RESPONSE_CACHE_MAX_ENTRIES = 100;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${entries.join(",")}}`;
}

export function buildAIResponseCacheKey(payload: Record<string, unknown>): string {
  const serialized = stableStringify(payload);
  return createHash("sha256").update(serialized).digest("hex");
}

export function getCachedAIResponse<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, cached);
  return cached.value as T;
}

export function setCachedAIResponse<T>(key: string, value: T): void {
  responseCache.delete(key);
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + AI_RESPONSE_CACHE_TTL_MS,
  });

  if (responseCache.size > AI_RESPONSE_CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
}
export function clearAIResponseCache(): void {
  responseCache.clear();
}
