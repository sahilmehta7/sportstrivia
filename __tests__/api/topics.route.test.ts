/** @jest-environment node */

jest.mock("next/server", () => ({
  NextRequest: class {},
}));

const successResponseMock = jest.fn((body: any, init?: { status?: number }) => ({
  status: init?.status ?? 200,
  json: async () => ({ data: body }),
}));
const handleErrorMock = jest.fn((error: any) => ({
  status: 500,
  json: async () => ({ error: String(error?.message ?? "error") }),
}));

jest.mock("@/lib/errors", () => ({
  successResponse: (body: any, init?: { status?: number }) => successResponseMock(body, init),
  handleError: (error: any) => handleErrorMock(error),
}));

const searchTopicsMock = jest.fn();
jest.mock("@/lib/services/topic.service", () => ({
  searchTopics: (...args: any[]) => searchTopicsMock(...args),
}));

var prismaMock: {
  topic: {
    findMany: jest.Mock;
  };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    topic: {
      findMany: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

import { GET } from "@/app/api/topics/route";

describe("GET /api/topics pagination behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.topic.findMany.mockResolvedValue([]);
    searchTopicsMock.mockResolvedValue({ topics: [], pagination: { page: 1, limit: 20, total: 0 } });
  });

  it("applies skip/take in flat non-search mode", async () => {
    await GET(new Request("http://localhost/api/topics?page=3&limit=25") as any);

    expect(prismaMock.topic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 25,
        orderBy: [{ level: "asc" }, { name: "asc" }],
      })
    );
  });

  it("applies skip/take in hierarchy non-search mode", async () => {
    await GET(new Request("http://localhost/api/topics?hierarchy=true&page=2&limit=10") as any);

    expect(prismaMock.topic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId: null },
        orderBy: { name: "asc" },
        skip: 10,
        take: 10,
      })
    );
  });

  it("keeps search flow delegated to searchTopics", async () => {
    await GET(new Request("http://localhost/api/topics?search=cricket&page=2&limit=7") as any);

    expect(searchTopicsMock).toHaveBeenCalledWith(
      { query: "cricket", page: 2, limit: 7 },
      { telemetryEnabled: true }
    );
    expect(prismaMock.topic.findMany).not.toHaveBeenCalled();
  });
});

