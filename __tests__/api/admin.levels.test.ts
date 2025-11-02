import { GET, POST } from "@/app/api/admin/levels/route";

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
  level: {
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    level: {
      findMany: jest.fn().mockResolvedValue([
        { level: 1, pointsRequired: 100, isActive: true },
        { level: 2, pointsRequired: 300, isActive: true },
      ]),
      upsert: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

describe("/api/admin/levels", () => {
  beforeEach(() => {
    prismaMock.level.findMany.mockClear();
    prismaMock.level.upsert.mockClear();
  });

  it("GET lists levels", async () => {
    const res = await GET();
    const json = await (res as any).json();
    expect(Array.isArray(json.data.levels)).toBe(true);
    expect(json.data.levels[0].level).toBe(1);
  });

  it("POST bulk upserts levels", async () => {
    const req: any = {
      json: jest.fn().mockResolvedValue({
        levels: [
          { level: 1, pointsRequired: 100 },
          { level: 2, pointsRequired: 300 },
        ],
      }),
    };
    const res = await POST(req);
    expect(prismaMock.level.upsert).toHaveBeenCalledTimes(2);
    const json = await (res as any).json();
    expect(json.data.levels.length).toBeGreaterThan(0);
  });
});
