import { NotificationDigestFrequency } from "@prisma/client";
import { runDigestJob } from "@/lib/jobs/digest.job";

jest.mock("@/lib/services/notification-preferences.service", () => ({
  getUsersDueForDigest: jest.fn(),
  markDigestSent: jest.fn(),
}));

jest.mock("@/lib/services/digest-email.service", () => ({
  sendDigestEmail: jest.fn(),
}));

var prismaMock: {
  notification: { findMany: jest.Mock };
  user: { findUnique: jest.Mock };
};

jest.mock("@/lib/db", () => {
  prismaMock = {
    notification: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

const {
  getUsersDueForDigest,
  markDigestSent,
} = jest.requireMock("@/lib/services/notification-preferences.service") as {
  getUsersDueForDigest: jest.Mock;
  markDigestSent: jest.Mock;
};

const { sendDigestEmail } = jest.requireMock(
  "@/lib/services/digest-email.service"
) as {
  sendDigestEmail: jest.Mock;
};

describe("runDigestJob", () => {
  const referenceDate = new Date("2025-02-15T09:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    prismaMock.notification.findMany.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("sends digest email when notifications exist", async () => {
    getUsersDueForDigest.mockResolvedValue([
      {
        userId: "user_digest",
        digestFrequency: "DAILY",
        emailOptIn: true,
        lastDigestAt: null,
      },
    ]);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_digest",
      email: "player@example.com",
      name: "Player One",
    });

    prismaMock.notification.findMany.mockResolvedValue([
      {
        id: "notif1",
        type: "CHALLENGE_RECEIVED",
        content: JSON.stringify({
          title: "New challenge",
          message: "Alex challenged you to Cricket Blitz",
        }),
        createdAt: new Date("2025-02-14T10:00:00.000Z"),
      },
    ]);

    await runDigestJob(NotificationDigestFrequency.DAILY, referenceDate);

    expect(sendDigestEmail).toHaveBeenCalledTimes(1);
    expect(sendDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@example.com",
        subject: "Your daily Sports Trivia digest",
      })
    );
    expect(markDigestSent).toHaveBeenCalledWith("user_digest", referenceDate);
  });

  it("skips email when no notifications are found", async () => {
    getUsersDueForDigest.mockResolvedValue([
      {
        userId: "user_digest",
        digestFrequency: "DAILY",
        emailOptIn: true,
        lastDigestAt: null,
      },
    ]);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_digest",
      email: "player@example.com",
      name: "Player One",
    });
    prismaMock.notification.findMany.mockResolvedValue([]);

    await runDigestJob(NotificationDigestFrequency.DAILY, referenceDate);

    expect(sendDigestEmail).not.toHaveBeenCalled();
    expect(markDigestSent).toHaveBeenCalledWith("user_digest", referenceDate);
  });
});
