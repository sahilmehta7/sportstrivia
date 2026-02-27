import { parseTopicEntityData, requiresCanonicalUrl, sanitizeUrlList } from "@/lib/topic-schema";

describe("topic schema validation helpers", () => {
  it("deduplicates and trims sameAs URLs", () => {
    expect(
      sanitizeUrlList([
        " https://example.com/a ",
        "https://example.com/a",
        "https://example.com/b",
        "",
      ])
    ).toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("returns null entity data for NONE", () => {
    expect(parseTopicEntityData("NONE", { sportName: "Cricket" })).toBeNull();
  });

  it("accepts allowed fields for SPORTS_TEAM", () => {
    expect(
      parseTopicEntityData("SPORTS_TEAM", {
        sportName: "Cricket",
        leagueName: "IPL",
      })
    ).toEqual({
      sportName: "Cricket",
      leagueName: "IPL",
    });
  });

  it("rejects unsupported entity fields", () => {
    expect(() =>
      parseTopicEntityData("ATHLETE", {
        unsupported: "value",
      })
    ).toThrow();
  });

  it("requires canonical URL for non-NONE schema types", () => {
    expect(requiresCanonicalUrl("NONE")).toBe(false);
    expect(requiresCanonicalUrl("SPORT")).toBe(true);
    expect(requiresCanonicalUrl("ATHLETE")).toBe(true);
  });
});

