import { normalizeClaimForConflict } from "@/lib/services/topic-content/verify.service";

describe("topic content verify", () => {
  it("normalizes equivalent claims for conflict detection", () => {
    const a = normalizeClaimForConflict("Founded: 1877!");
    const b = normalizeClaimForConflict(" founded: 1877 ");
    expect(a).toBe(b);
  });
});
