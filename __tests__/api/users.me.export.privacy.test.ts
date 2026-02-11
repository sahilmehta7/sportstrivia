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

import { GET } from "@/app/api/users/me/export/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

var prismaMock: any;
jest.mock("@/lib/db", () => {
  prismaMock = {
    user: { findUnique: jest.fn() },
    account: { findMany: jest.fn() },
    quizAttempt: { findMany: jest.fn() },
    userBadge: { findMany: jest.fn() },
    friend: { findMany: jest.fn() },
    challenge: { findMany: jest.fn() },
    notification: { findMany: jest.fn() },
    quizReview: { findMany: jest.fn() },
    userTopicStats: { findMany: jest.fn() },
    userLevel: { findMany: jest.fn() },
    userTierHistory: { findMany: jest.fn() },
    userSearchQuery: { findMany: jest.fn() },
    userNotificationPreference: { findUnique: jest.fn() },
  };
  return { prisma: prismaMock };
});

const { requireAuth } = require("@/lib/auth-helpers") as {
  requireAuth: jest.Mock;
};

describe("GET /api/users/me/export privacy", () => {
  beforeAll(() => {
    if (!(global as any).Response) {
      (global as any).Response = class MockResponse {
        status: number;
        headers: Record<string, string>;
        private body: string;

        constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
          this.body = body;
          this.status = init?.status ?? 200;
          this.headers = init?.headers ?? {};
        }

        async json() {
          return JSON.parse(this.body);
        }
      };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireAuth.mockResolvedValue({ id: "user_1" });
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", email: "me@example.com", name: "Me" });
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.quizAttempt.findMany.mockResolvedValue([]);
    prismaMock.userBadge.findMany.mockResolvedValue([]);
    prismaMock.challenge.findMany.mockResolvedValue([]);
    prismaMock.notification.findMany.mockResolvedValue([]);
    prismaMock.quizReview.findMany.mockResolvedValue([]);
    prismaMock.userTopicStats.findMany.mockResolvedValue([]);
    prismaMock.userLevel.findMany.mockResolvedValue([]);
    prismaMock.userTierHistory.findMany.mockResolvedValue([]);
    prismaMock.userSearchQuery.findMany.mockResolvedValue([]);
    prismaMock.userNotificationPreference.findUnique.mockResolvedValue(null);
  });

  it("does not include friend email addresses in exported data", async () => {
    prismaMock.friend.findMany
      .mockResolvedValueOnce([{ friend: { id: "u2", name: "Friend One" } }])
      .mockResolvedValueOnce([{ user: { id: "u3", name: "Friend Two" } }]);

    const response = await GET({} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.exportVersion).toBe("1.1");
    expect(json.friends[0].friend.email).toBeUndefined();
    expect(json.friendOf[0].user.email).toBeUndefined();
  });
});
