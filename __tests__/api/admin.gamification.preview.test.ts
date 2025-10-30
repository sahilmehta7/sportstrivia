import { GET } from "@/app/api/admin/gamification/preview/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin", role: "ADMIN" }),
}));

let prismaMock: any;
jest.mock("@/lib/db", () => {
  prismaMock = {
    level: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma: prismaMock };
});

describe("GET /api/admin/gamification/preview", () => {
  it("returns preview rows", async () => {
    const request = { url: "http://localhost/api/admin/gamification/preview" } as any;
    const res = await GET(request as any);
    const json = await (res as any).json();
    expect(json.preview.length).toBeGreaterThan(0);
    expect(json.preview[0]).toHaveProperty("level");
    expect(json.preview[0]).toHaveProperty("effective");
  });
});


