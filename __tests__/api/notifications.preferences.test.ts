import { GET, PUT } from "@/app/api/notifications/preferences/route";

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

jest.mock("@/lib/services/notification-preferences.service", () => ({
  getOrCreateNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const { requireAuth } = jest.requireMock("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

const {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} = jest.requireMock("@/lib/services/notification-preferences.service") as {
  getOrCreateNotificationPreferences: jest.Mock;
  updateNotificationPreferences: jest.Mock;
};

describe("GET /api/notifications/preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_pref" });
    getOrCreateNotificationPreferences.mockResolvedValue({
      userId: "user_pref",
      digestFrequency: "DAILY",
      digestTimeOfDay: 9,
      digestTimeZone: "America/New_York",
      emailOptIn: true,
      pushOptIn: true,
      lastDigestAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("returns user notification preferences", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data.preferences).toMatchObject({
      userId: "user_pref",
      digestFrequency: "DAILY",
      emailOptIn: true,
      pushOptIn: true,
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(getOrCreateNotificationPreferences).toHaveBeenCalledWith("user_pref");
  });
});

describe("PUT /api/notifications/preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_pref" });
    updateNotificationPreferences.mockResolvedValue({
      userId: "user_pref",
      digestFrequency: "WEEKLY",
      digestTimeOfDay: 10,
      digestTimeZone: "UTC",
      emailOptIn: false,
      pushOptIn: false,
      lastDigestAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("updates preferences with provided payload", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({
        digestFrequency: "WEEKLY",
        emailOptIn: false,
        pushOptIn: false,
      }),
    } as any;

    const response = await PUT(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data.preferences).toMatchObject({
      digestFrequency: "WEEKLY",
      emailOptIn: false,
      pushOptIn: false,
    });

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(updateNotificationPreferences).toHaveBeenCalledWith("user_pref", {
      digestFrequency: "WEEKLY",
      emailOptIn: false,
      pushOptIn: false,
    });
  });
});
