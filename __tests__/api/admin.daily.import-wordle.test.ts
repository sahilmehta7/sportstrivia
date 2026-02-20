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
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin_123", role: "ADMIN" }),
}));

jest.mock("@/lib/db", () => {
  const mockPrisma: any = {
    dailyGame: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dailyGameAttempt: {
      groupBy: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrisma)),
  };

  return { prisma: mockPrisma };
});

import { POST } from "@/app/api/admin/daily/import/route";
import { prisma } from "@/lib/db";

describe("POST /api/admin/daily/import", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.dailyGame.create as jest.Mock).mockResolvedValue({ id: "dg_1" });
    (prisma.dailyGame.update as jest.Mock).mockResolvedValue({ id: "dg_1" });
    (prisma.dailyGameAttempt.groupBy as jest.Mock).mockResolvedValue([]);
  });

  const createRequest = (body: any) =>
    ({
      json: jest.fn().mockResolvedValue(body),
    } as any);

  it("creates WORD games for consecutive dates", async () => {
    (prisma.dailyGame.findMany as jest.Mock).mockResolvedValue([]);

    const response = await POST(
      createRequest({
        startDate: "2026-02-19",
        words: ["score", "title", "drive"],
      })
    );

    expect(response.status).toBe(201);
    const json = await (response as any).json();
    expect(json.success).toBe(true);
    expect(json.data.createdCount).toBe(3);
    expect(json.data.updatedCount).toBe(0);
    expect(json.data.skippedCount).toBe(0);

    expect(prisma.dailyGame.create).toHaveBeenCalledTimes(3);
    expect(prisma.dailyGame.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          date: "2026-02-19",
          gameType: "WORD",
          targetValue: "SCORE",
        }),
      })
    );
    expect(prisma.dailyGame.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          date: "2026-02-20",
          gameType: "WORD",
          targetValue: "TITLE",
        }),
      })
    );
    expect(prisma.dailyGame.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({
          date: "2026-02-21",
          gameType: "WORD",
          targetValue: "DRIVE",
        }),
      })
    );
  });

  it("skips existing dates by default", async () => {
    (prisma.dailyGame.findMany as jest.Mock).mockResolvedValue([
      { id: "dg_existing", date: "2026-02-20", gameType: "WORD" },
    ]);

    const response = await POST(
      createRequest({
        startDate: "2026-02-19",
        words: ["SCORE", "TITLE", "DRIVE"],
      })
    );

    expect(response.status).toBe(201);
    const json = await (response as any).json();
    expect(json.data.createdCount).toBe(2);
    expect(json.data.updatedCount).toBe(0);
    expect(json.data.skippedCount).toBe(1);
    expect(prisma.dailyGameAttempt.groupBy).not.toHaveBeenCalled();
  });

  it("overwrites existing WORD games when overwriteExisting is true", async () => {
    (prisma.dailyGame.findMany as jest.Mock).mockResolvedValue([
      { id: "dg_existing", date: "2026-02-20", gameType: "WORD" },
    ]);
    (prisma.dailyGameAttempt.groupBy as jest.Mock).mockResolvedValue([
      { dailyGameId: "dg_existing", _count: { _all: 0 } },
    ]);

    const response = await POST(
      createRequest({
        startDate: "2026-02-19",
        words: ["SCORE", "TITLE", "DRIVE"],
        overwriteExisting: true,
      })
    );

    expect(response.status).toBe(201);
    const json = await (response as any).json();
    expect(json.data.createdCount).toBe(2);
    expect(json.data.updatedCount).toBe(1);
    expect(prisma.dailyGame.update).toHaveBeenCalledTimes(1);
  });

  it("never overwrites non-WORD games and reports conflict", async () => {
    (prisma.dailyGame.findMany as jest.Mock).mockResolvedValue([
      { id: "dg_existing", date: "2026-02-20", gameType: "TEAM" },
    ]);
    (prisma.dailyGameAttempt.groupBy as jest.Mock).mockResolvedValue([
      { dailyGameId: "dg_existing", _count: { _all: 0 } },
    ]);

    const response = await POST(
      createRequest({
        startDate: "2026-02-19",
        words: ["SCORE", "TITLE", "DRIVE"],
        overwriteExisting: true,
      })
    );

    expect(response.status).toBe(201);
    const json = await (response as any).json();
    expect(json.data.conflictCount).toBe(1);
    expect(prisma.dailyGame.update).not.toHaveBeenCalled();
  });

  it("rejects words with spaces or punctuation", async () => {
    const response = await POST(
      createRequest({
        startDate: "2026-02-19",
        words: ["MAN UNITED"],
      })
    );

    expect(response.status).toBe(400);
    const json = await (response as any).json();
    expect(json.error).toBe("Invalid input");
  });
});

