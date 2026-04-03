import type { PersonalizedHomeVariant } from "@/types/personalized-home";
import { isPersonalizedHomeExperimentEnabled } from "@/lib/feature-flags";

function stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

export function getPersonalizedHomeVariantForUser(userId: string): PersonalizedHomeVariant {
  if (!isPersonalizedHomeExperimentEnabled()) {
    return "treatment";
  }

  const bucket = stableHash(userId) % 100;
  return bucket < 50 ? "control" : "treatment";
}

export function getPersonalizedHomeBucket(userId: string): number {
  return stableHash(userId) % 100;
}
