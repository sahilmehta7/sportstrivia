/** @jest-environment node */

import { POST } from "@/app/api/admin/sitemap/route";
import { requireAuth, isAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
  isAdmin: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("POST /api/admin/sitemap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (isAdmin as jest.Mock).mockResolvedValue(true);
  });

  it("returns forbidden for non-admin users", async () => {
    (isAdmin as jest.Mock).mockResolvedValue(false);

    const response = await POST({} as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Only admins can regenerate the sitemap");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates sitemap cache for admins", async () => {
    const response = await POST({} as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain("invalidated");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
