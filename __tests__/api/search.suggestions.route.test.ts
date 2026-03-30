/** @jest-environment node */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));

jest.mock("@/lib/services/search-query.service", () => ({
  getRecentSearchQueriesForUser: jest.fn(),
  getTrendingSearchQueries: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  searchSuggestionsRateLimiter: {},
  checkRateLimitStrict: jest.fn(),
}));

jest.mock("@/lib/services/interest-profile.service", () => ({
  getInterestProfileForUser: jest.fn(),
}));

jest.mock("@/lib/feature-flags", () => ({
  isSearchProfileBiasEnabled: jest.fn(),
}));

import { GET } from "@/app/api/search/suggestions/route";
import { auth } from "@/lib/auth";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";
import { checkRateLimitStrict } from "@/lib/rate-limit";
import { getInterestProfileForUser } from "@/lib/services/interest-profile.service";
import { isSearchProfileBiasEnabled } from "@/lib/feature-flags";

describe("search suggestions route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimitStrict as jest.Mock).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user_1" } });
    (isSearchProfileBiasEnabled as jest.Mock).mockReturnValue(true);
    (getRecentSearchQueriesForUser as jest.Mock).mockResolvedValue([]);
  });

  it("dedupes profile + trending suggestions and caps to stable limit", async () => {
    (getInterestProfileForUser as jest.Mock).mockResolvedValue({
      contractVersion: "interest-profile/v1",
      summary: {
        topEntities: ["Cricket", "India", "IPL"],
      },
    });

    (getTrendingSearchQueries as jest.Mock).mockResolvedValue([
      {
        query: "cricket",
        lastResultCount: 12,
        lastSearchedAt: new Date("2026-03-20T00:00:00.000Z"),
        timesSearched: 5,
      },
      {
        query: "football",
        lastResultCount: 20,
        lastSearchedAt: new Date("2026-03-21T00:00:00.000Z"),
        timesSearched: 8,
      },
      {
        query: "basketball",
        lastResultCount: 9,
        lastSearchedAt: new Date("2026-03-22T00:00:00.000Z"),
        timesSearched: 4,
      },
      {
        query: "tennis",
        lastResultCount: 7,
        lastSearchedAt: new Date("2026-03-23T00:00:00.000Z"),
        timesSearched: 3,
      },
      {
        query: "f1",
        lastResultCount: 11,
        lastSearchedAt: new Date("2026-03-24T00:00:00.000Z"),
        timesSearched: 6,
      },
      {
        query: "ipl",
        lastResultCount: 15,
        lastSearchedAt: new Date("2026-03-25T00:00:00.000Z"),
        timesSearched: 7,
      },
      {
        query: "kabaddi",
        lastResultCount: 5,
        lastSearchedAt: new Date("2026-03-26T00:00:00.000Z"),
        timesSearched: 2,
      },
      {
        query: "nba",
        lastResultCount: 10,
        lastSearchedAt: new Date("2026-03-27T00:00:00.000Z"),
        timesSearched: 3,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/search/suggestions?context=TOPIC") as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.suggestions.trending).toHaveLength(8);

    const queries = body.data.suggestions.trending.map((item: any) => item.query.toLowerCase());
    expect(new Set(queries).size).toBe(queries.length);
    expect(queries[0]).toBe("cricket");
    expect(queries[1]).toBe("india");
    expect(queries[2]).toBe("ipl");

    expect(body.data.meta.gateBSignals.profileBiasApplied).toBe(true);
    expect(body.data.meta.gateBSignals.fallbackApplied).toBe(false);
  });

  it("keeps deterministic fallback when profile bias is unavailable", async () => {
    (isSearchProfileBiasEnabled as jest.Mock).mockReturnValue(false);
    (getTrendingSearchQueries as jest.Mock).mockResolvedValue([
      {
        query: "football",
        lastResultCount: 20,
        lastSearchedAt: new Date("2026-03-21T00:00:00.000Z"),
        timesSearched: 8,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/search/suggestions?context=TOPIC") as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.suggestions.trending).toEqual([
      expect.objectContaining({
        query: "football",
        source: "trending",
      }),
    ]);
    expect(body.data.meta.gateBSignals.profileBiasApplied).toBe(false);
    expect(body.data.meta.gateBSignals.fallbackApplied).toBe(true);
  });
});
