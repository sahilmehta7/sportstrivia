import { getTopicGraphSchema } from "@/lib/schema-utils";

describe("getTopicGraphSchema", () => {
  it("emits collection + primary entity graph for typed topic", () => {
    const graph = getTopicGraphSchema({
      topic: {
        id: "topic_1",
        name: "Cricket",
        slug: "cricket",
        description: "Everything cricket",
        schemaType: "SPORT",
        schemaCanonicalUrl: "https://en.wikipedia.org/wiki/Cricket",
        schemaSameAs: ["https://www.wikidata.org/wiki/Q5372"],
        schemaEntityData: { aliases: ["Bat-and-ball"] },
        parent: null,
      },
      quizUrls: [
        "https://www.sportstrivia.in/quizzes/cricket-basics",
        "https://www.sportstrivia.in/quizzes/ipl-history",
      ],
    });

    expect(graph["@context"]).toBe("https://schema.org");
    expect(Array.isArray(graph["@graph"])).toBe(true);
    expect(graph["@graph"]).toHaveLength(2);

    const collection = graph["@graph"][0] as any;
    const entity = graph["@graph"][1] as any;

    expect(collection["@type"]).toBe("CollectionPage");
    expect(collection["@id"]).toBe("https://www.sportstrivia.in/topics/cricket#collection");
    expect(collection.mainEntity["@id"]).toBe("https://www.sportstrivia.in/topics/cricket#entity");
    expect(collection.hasPart).toHaveLength(2);

    expect(entity["@type"]).toBe("DefinedTerm");
    expect(entity["@id"]).toBe("https://www.sportstrivia.in/topics/cricket#entity");
    expect(entity.url).toBe("https://en.wikipedia.org/wiki/Cricket");
    expect(entity.sameAs).toEqual(["https://www.wikidata.org/wiki/Q5372"]);
  });

  it("falls back to collection-only graph when canonical URL is missing", () => {
    const graph = getTopicGraphSchema({
      topic: {
        id: "topic_2",
        name: "Football",
        slug: "football",
        schemaType: "SPORT",
        schemaCanonicalUrl: null,
        schemaSameAs: [],
        schemaEntityData: null,
        parent: null,
      },
      quizUrls: [],
    });

    expect(graph["@graph"]).toHaveLength(1);
    expect((graph["@graph"][0] as any)["@type"]).toBe("CollectionPage");
    expect((graph["@graph"][0] as any).mainEntity).toBeUndefined();
  });

  it("links sport topics to typed parent with broader", () => {
    const graph = getTopicGraphSchema({
      topic: {
        id: "topic_3",
        name: "Twenty20",
        slug: "twenty20",
        schemaType: "SPORT",
        schemaCanonicalUrl: "https://en.wikipedia.org/wiki/Twenty20",
        schemaSameAs: [],
        schemaEntityData: null,
        parent: {
          name: "Cricket",
          slug: "cricket",
          schemaType: "SPORT",
          schemaCanonicalUrl: "https://en.wikipedia.org/wiki/Cricket",
          schemaSameAs: [],
        },
      },
      quizUrls: [],
    });

    const entity = graph["@graph"][1] as any;
    expect(entity.broader["@id"]).toBe("https://www.sportstrivia.in/topics/cricket#entity");
  });
});

