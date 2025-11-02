import { POST, DELETE } from "@/app/api/notifications/subscriptions/route";

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
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/services/push-subscription.service", () => ({
  upsertPushSubscription: jest.fn(),
  removePushSubscription: jest.fn(),
}));

const { requireAuth } = jest.requireMock("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

const {
  upsertPushSubscription,
  removePushSubscription,
} = jest.requireMock("@/lib/services/push-subscription.service") as {
  upsertPushSubscription: jest.Mock;
  removePushSubscription: jest.Mock;
};

describe("POST /api/notifications/subscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_123" });
    upsertPushSubscription.mockResolvedValue({
      id: "sub_123",
      endpoint: "https://push.example.com/subscription",
    });
  });

  it("stores subscription payload and returns subscription id", async () => {
    const body = {
      endpoint: "https://push.example.com/subscription",
      keys: {
        p256dh: "p256key",
        auth: "authKey",
      },
    };

    const request = {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn((key: string) =>
          key === "user-agent" ? "Jest User Agent" : null
        ),
      },
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.data).toEqual({
      subscriptionId: "sub_123",
      endpoint: body.endpoint,
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(upsertPushSubscription).toHaveBeenCalledWith(
      "user_123",
      body,
      expect.objectContaining({
        userAgent: "Jest User Agent",
        deviceType: undefined,
      })
    );
  });
});

describe("DELETE /api/notifications/subscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_456" });
    removePushSubscription.mockResolvedValue(true);
  });

  it("removes subscription by endpoint", async () => {
    const body = {
      endpoint: "https://push.example.com/subscription",
    };

    const request = {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn(),
      },
    } as any;

    const response = await DELETE(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toEqual({
      removed: true,
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(removePushSubscription).toHaveBeenCalledWith("user_456", body.endpoint);
  });
});
