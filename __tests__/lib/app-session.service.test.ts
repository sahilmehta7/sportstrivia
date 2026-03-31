/** @jest-environment node */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { getOptionalSession } from "@/lib/services/app-session.service";

describe("getOptionalSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns session when auth succeeds", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user_1" } });

    await expect(getOptionalSession("root-layout")).resolves.toEqual({
      user: { id: "user_1" },
    });
  });

  it("returns null when auth throws", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    (auth as jest.Mock).mockRejectedValue(new Error("db down"));

    await expect(getOptionalSession("root-layout")).resolves.toBeNull();
    expect(spy).toHaveBeenCalledWith(
      "[auth:optional-session-fallback]",
      expect.objectContaining({
        context: "root-layout",
      })
    );

    spy.mockRestore();
  });
});
