import { topicImportSchema } from "@/lib/validations/topic-import.schema";

describe("topic import schema", () => {
  it("accepts schema typing fields in topic import payload", () => {
    const parsed = topicImportSchema.parse({
      topics: [
        {
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
          schemaCanonicalUrl: "https://en.wikipedia.org/wiki/Cricket",
          schemaSameAs: ["https://www.wikidata.org/wiki/Q5372"],
          schemaEntityData: {
            aliases: ["Bat-and-ball"],
          },
        },
      ],
    });

    expect(parsed.topics[0].schemaType).toBe("SPORT");
    expect(parsed.topics[0].schemaCanonicalUrl).toBe("https://en.wikipedia.org/wiki/Cricket");
  });

  it("rejects invalid schemaType", () => {
    expect(() =>
      topicImportSchema.parse({
        topics: [
          {
            name: "Cricket",
            schemaType: "INVALID_TYPE",
          },
        ],
      })
    ).toThrow();
  });
});

