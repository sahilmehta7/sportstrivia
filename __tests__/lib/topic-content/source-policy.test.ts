import { evaluateSourcePolicy, isSourceBlocked } from "@/lib/content/source-policy";

describe("source policy", () => {
  it("allows commercial-safe sources", () => {
    expect(evaluateSourcePolicy("wikidata")).toMatchObject({
      allowed: true,
      isCommercialSafe: true,
      licenseType: "CC0",
    });
    expect(evaluateSourcePolicy("openalex").allowed).toBe(true);
    expect(evaluateSourcePolicy("crossref").allowed).toBe(true);
  });

  it("marks wikipedia as allowed but not commercial-safe", () => {
    expect(evaluateSourcePolicy("wikipedia")).toMatchObject({
      allowed: true,
      isCommercialSafe: false,
      licenseType: "CC-BY-SA",
    });
  });

  it("blocks unknown sources", () => {
    expect(isSourceBlocked("the-trivia-api")).toBe(true);
  });
});
