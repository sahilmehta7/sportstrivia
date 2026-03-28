import {
  normalizeClaimForConflict,
  partitionClaimsForVerification,
} from "@/lib/services/topic-content/verify.service";

describe("topic content verify", () => {
  it("normalizes equivalent claims for conflict detection", () => {
    const a = normalizeClaimForConflict("Founded: 1877!");
    const b = normalizeClaimForConflict(" founded: 1877 ");
    expect(a).toBe(b);
  });

  it("caps selected claims and still marks duplicates contradicted", () => {
    const claims = Array.from({ length: 205 }, (_, index) => ({
      id: `id_${index}`,
      claimText: `claim.${index}: value ${index}`,
    }));

    claims.push({ id: "dup_1", claimText: "claim.0: value 0" });
    claims.push({ id: "dup_2", claimText: " claim.1: value 1 " });

    const result = partitionClaimsForVerification(claims, 200);

    expect(result.selectedIds).toHaveLength(200);
    expect(result.overflowIds).toHaveLength(5);
    expect(result.contradictedIds).toEqual(expect.arrayContaining(["dup_1", "dup_2"]));
  });
});
