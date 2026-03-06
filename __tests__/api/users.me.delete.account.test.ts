import { DELETE } from "@/app/api/users/me/route";

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

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/services/restore-lock.service", () => ({
  assertRestoreUnlocked: jest.fn(),
}));

var prismaMock: {
  $transaction: jest.Mock;
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    $transaction: jest.fn(),
  };
  return { prisma: prismaMock };
});

const { requireAuth } = jest.requireMock("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

const { assertRestoreUnlocked } = jest.requireMock(
  "@/lib/services/restore-lock.service"
) as {
  assertRestoreUnlocked: jest.Mock;
};

describe("DELETE /api/users/me", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    requireAuth.mockResolvedValue({ id: "user_delete_1" });
    assertRestoreUnlocked.mockResolvedValue(undefined);

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          delete: jest.fn().mockResolvedValue({ id: "user_delete_1" }),
        },
      });
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("deletes account successfully when authenticated and restore is unlocked", async () => {
    const response = await DELETE({} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      success: true,
      message: "Your account has been permanently deleted",
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(assertRestoreUnlocked).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns unauthorized when requireAuth throws", async () => {
    requireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    const response = await DELETE({} as any);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });

    expect(assertRestoreUnlocked).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns handled error when restore lock blocks deletion", async () => {
    assertRestoreUnlocked.mockRejectedValueOnce(
      new Error("Restore in progress")
    );

    const response = await DELETE({} as any);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns handled error when database deletion fails", async () => {
    prismaMock.$transaction.mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await DELETE({} as any);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  });

  it("returns handled error on second delete attempt when user no longer exists", async () => {
    prismaMock.$transaction.mockRejectedValueOnce(
      new Error("Record to delete does not exist.")
    );

    const response = await DELETE({} as any);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  });
});

