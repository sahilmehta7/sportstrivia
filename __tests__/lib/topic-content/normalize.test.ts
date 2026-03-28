import { extractClaimsFromPayload, inferClaimType } from "@/lib/services/topic-content/normalize.service";

describe("topic content normalize", () => {
  it("extracts nested string/number/boolean claim-like entries", () => {
    const claims = extractClaimsFromPayload({
      name: "Cricket Sport",
      founded: 1877,
      olympic: false,
      nested: { a: 1, summary: "Widely played bat-and-ball sport." },
      blank: "   ",
      short: "abc",
    });

    expect(claims).toEqual(
      expect.arrayContaining([
        "name: Cricket Sport",
        "founded: 1877",
        "olympic: false",
        "nested.a: 1",
        "nested.summary: Widely played bat-and-ball sport.",
      ])
    );
    expect(claims.some((c) => c.startsWith("short:"))).toBe(false);
  });

  it("filters metadata-like noisy paths", () => {
    const claims = extractClaimsFromPayload({
      sourceName: "wikipedia",
      id: "Q123",
      profileUrl: "https://example.com",
      hash: "abcdef",
      payload: {
        fetchError: "timeout",
        label: "Lionel Messi",
        description: "Argentine footballer.",
      },
    });

    expect(claims.some((c) => c.includes("sourceName"))).toBe(false);
    expect(claims.some((c) => c.includes("id:"))).toBe(false);
    expect(claims.some((c) => c.includes("profileUrl"))).toBe(false);
    expect(claims).toEqual(expect.arrayContaining(["payload.label: Lionel Messi", "payload.description: Argentine footballer."]));
  });

  it("truncates long strings at 1000 and keeps shorter valid facts", () => {
    const long = "x".repeat(1200);
    const claims = extractClaimsFromPayload({
      summary: long,
      tiny: "small",
    });

    const summaryClaim = claims.find((claim) => claim.startsWith("summary: "));
    expect(summaryClaim).toBeDefined();
    expect(summaryClaim?.length).toBe("summary: ".length + 1000);
    expect(claims.some((c) => c.startsWith("tiny:"))).toBe(false);
  });

  it("infers claim types", () => {
    expect(inferClaimType("founded: 1877")).toBe("TIMELINE");
    expect(inferClaimType("record: 55%")).toBe("STAT");
    expect(inferClaimType("team: India")).toBe("ENTITY_RELATION");
    expect(inferClaimType("name: Cricket")).toBe("FACT");
  });
});
