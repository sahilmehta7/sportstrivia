/** @jest-environment node */

import { POST } from "@/app/api/admin/topics/[id]/content/publish/route";
import { requireAdmin } from "@/lib/auth-helpers";
import { runTopicPublish } from "@/lib/services/topic-content/pipeline.service";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/auth-helpers", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/topic-content/pipeline.service", () => ({
  runTopicPublish: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("POST /api/admin/topics/[id]/content/publish", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ id: "admin_1" });
    (runTopicPublish as jest.Mock).mockResolvedValue({ id: "snapshot_1" });
  });

  it("publishes topic content and invalidates sitemap cache", async () => {
    const response = await POST({} as any, { params: Promise.resolve({ id: "topic_1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      topicId: "topic_1",
      snapshotId: "snapshot_1",
      status: "PUBLISHED",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
