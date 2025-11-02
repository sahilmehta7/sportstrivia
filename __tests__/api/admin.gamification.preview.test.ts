import { GET } from "@/app/api/admin/gamification/preview/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: class {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin", role: "ADMIN" }),
}));

var prismaMock: {
  level: { findMany: jest.Mock };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    level: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma: prismaMock };
});

describe("GET /api/admin/gamification/preview", () => {
  beforeEach(() => {
    prismaMock.level.findMany.mockClear();
  });

  it("returns preview rows", async () => {
    const request = { url: "http://localhost/api/admin/gamification/preview" } as any;
    const res = await GET(request as any);
    const json = await (res as any).json();
    expect(json.data.preview.length).toBeGreaterThan(0);
    expect(json.data.preview[0]).toHaveProperty("level");
    expect(json.data.preview[0]).toHaveProperty("effective");
  });
});
