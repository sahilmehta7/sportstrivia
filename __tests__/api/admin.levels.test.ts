import { GET, POST } from "@/app/api/admin/levels/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin", role: "ADMIN" }),
}));

let prismaMock: any;
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
  it("GET lists levels", async () => {
    const res = await GET();
    const json = await (res as any).json();
    expect(Array.isArray(json.levels)).toBe(true);
    expect(json.levels[0].level).toBe(1);
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
    expect((await (res as any).json()).levels.length).toBeGreaterThan(0);
  });
});


