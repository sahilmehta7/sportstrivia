/** @jest-environment node */

import { POST } from "@/app/api/admin/topics/wiki-search/route";
import { requireAdmin } from "@/lib/auth-helpers";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

describe("POST /api/admin/topics/wiki-search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({
      id: "admin-user",
      role: "ADMIN",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps athlete metadata for Lionel Messi", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            search: [{ title: "Lionel Messi", pageid: 123 }],
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              "123": {
                title: "Lionel Messi",
                fullurl: "https://en.wikipedia.org/wiki/Lionel_Messi",
                description: "Argentine footballer (born 1987)",
                extract: "Lionel Andrés Messi is an Argentine professional footballer...",
                pageprops: { wikibase_item: "Q615" },
                categories: [{ title: "Category:Argentine men's footballers" }],
                original: { source: "https://upload.wikimedia.org/messi.jpg" },
              },
            },
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entities: {
            Q615: {
              id: "Q615",
              labels: { en: { language: "en", value: "Lionel Messi" } },
              aliases: {
                en: [{ language: "en", value: "Leo Messi" }],
              },
              claims: {
                P31: [{ mainsnak: { datavalue: { value: { id: "Q5" } } } }],
                P641: [{ mainsnak: { datavalue: { value: { id: "Q2736" } } } }],
                P54: [{ mainsnak: { datavalue: { value: { id: "Q280658" } } } }],
                P27: [{ mainsnak: { datavalue: { value: { id: "Q414" } } } }],
                P569: [{ mainsnak: { datavalue: { value: { time: "+1987-06-24T00:00:00Z" } } } }],
              },
            },
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entities: {
            Q5: { labels: { en: { value: "human" } } },
            Q2736: { labels: { en: { value: "association football" } } },
            Q280658: { labels: { en: { value: "Inter Miami CF" } } },
            Q414: { labels: { en: { value: "Argentina" } } },
          },
        }),
      } as any);

    const request = new Request("http://localhost:3200/api/admin/topics/wiki-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Lionel Messi" }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.schemaType).toBe("ATHLETE");
    expect(body.data.schemaCanonicalUrl).toBe("https://en.wikipedia.org/wiki/Lionel_Messi");
    expect(body.data.schemaSameAs).toContain("https://www.wikidata.org/wiki/Q615");
    expect(body.data.sportName).toBe("association football");
    expect(body.data.teamName).toBe("Inter Miami CF");
    expect(body.data.nationality).toBe("Argentina");
    expect(body.data.birthDate).toBe("1987-06-24");
    expect(body.data.aliases).toContain("Leo Messi");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("maps team metadata for Los Angeles Lakers", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            search: [{ title: "Los Angeles Lakers", pageid: 456 }],
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              "456": {
                title: "Los Angeles Lakers",
                fullurl: "https://en.wikipedia.org/wiki/Los_Angeles_Lakers",
                description: "American professional basketball team",
                extract: "The Los Angeles Lakers are an American professional basketball team...",
                pageprops: { wikibase_item: "Q121783" },
                categories: [{ title: "Category:National Basketball Association teams" }],
                original: { source: "https://upload.wikimedia.org/lakers.png" },
              },
            },
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entities: {
            Q121783: {
              id: "Q121783",
              labels: { en: { language: "en", value: "Los Angeles Lakers" } },
              claims: {
                P31: [{ mainsnak: { datavalue: { value: { id: "Q12973014" } } } }],
                P641: [{ mainsnak: { datavalue: { value: { id: "Q5372" } } } }],
                P118: [{ mainsnak: { datavalue: { value: { id: "Q155223" } } } }],
              },
            },
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entities: {
            Q12973014: { labels: { en: { value: "sports team" } } },
            Q5372: { labels: { en: { value: "basketball" } } },
            Q155223: { labels: { en: { value: "National Basketball Association" } } },
          },
        }),
      } as any);

    const request = new Request("http://localhost:3200/api/admin/topics/wiki-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Los Angeles Lakers" }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.schemaType).toBe("SPORTS_TEAM");
    expect(body.data.schemaCanonicalUrl).toBe("https://en.wikipedia.org/wiki/Los_Angeles_Lakers");
    expect(body.data.sportName).toBe("basketball");
    expect(body.data.leagueName).toBe("National Basketball Association");
    expect(body.data.schemaSameAs).toContain("https://www.wikidata.org/wiki/Q121783");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
