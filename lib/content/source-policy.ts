export type SourceName = "wikidata" | "openalex" | "crossref" | "wikipedia" | string;

export type SourcePolicyDecision = {
  allowed: boolean;
  isCommercialSafe: boolean;
  licenseType: string;
  reason?: string;
};

const COMMERCIAL_SAFE_ALLOWLIST = new Map<string, { licenseType: string }>([
  ["wikidata", { licenseType: "CC0" }],
  ["openalex", { licenseType: "CC0" }],
  ["crossref", { licenseType: "METADATA" }],
]);

// Wikipedia can be used for enrichment/provenance but is not default commercial-safe in strict mode.
const CONDITIONAL_ALLOWLIST = new Map<string, { licenseType: string; isCommercialSafe: boolean }>([
  ["wikipedia", { licenseType: "CC-BY-SA", isCommercialSafe: false }],
]);

export function evaluateSourcePolicy(sourceName: SourceName): SourcePolicyDecision {
  const normalized = sourceName.toLowerCase().trim();
  const safe = COMMERCIAL_SAFE_ALLOWLIST.get(normalized);
  if (safe) {
    return {
      allowed: true,
      isCommercialSafe: true,
      licenseType: safe.licenseType,
    };
  }

  const conditional = CONDITIONAL_ALLOWLIST.get(normalized);
  if (conditional) {
    return {
      allowed: true,
      isCommercialSafe: conditional.isCommercialSafe,
      licenseType: conditional.licenseType,
      reason: "Allowed for attribution/provenance only in strict commercial-safe mode.",
    };
  }

  return {
    allowed: false,
    isCommercialSafe: false,
    licenseType: "BLOCKED",
    reason: "Source is not in the allowlist for strict commercial-safe ingestion.",
  };
}

export function isSourceBlocked(sourceName: SourceName): boolean {
  return !evaluateSourcePolicy(sourceName).allowed;
}
