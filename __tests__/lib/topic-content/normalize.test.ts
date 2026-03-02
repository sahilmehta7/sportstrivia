import { extractClaimsFromPayload, inferClaimType } from "@/lib/services/topic-content/normalize.service";

describe("topic content normalize", () => {
  it("extracts string/number/boolean claim-like entries", () => {
    const claims = extractClaimsFromPayload({
      name: "Cricket",
      founded: 1877,
      olympic: false,
      nested: { a: 1 },
      blank: "   ",
    });

    expect(claims).toEqual(expect.arrayContaining(["name: Cricket", "founded: 1877", "olympic: false"]));
    expect(claims.some((c) => c.includes("nested"))).toBe(false);
  });

  it("infers claim types", () => {
    expect(inferClaimType("founded: 1877")).toBe("TIMELINE");
    expect(inferClaimType("record: 55%")).toBe("STAT");
    expect(inferClaimType("team: India")).toBe("ENTITY_RELATION");
    expect(inferClaimType("name: Cricket")).toBe("FACT");
  });
});
