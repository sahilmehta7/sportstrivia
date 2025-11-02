import { NotificationDigestFrequency } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUsersDueForDigest, markDigestSent } from "@/lib/services/notification-preferences.service";
import { sendDigestEmail } from "@/lib/services/digest-email.service";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.sportstrivia.in";

function formatNotificationContent(
  notification: { type: string; content: string; createdAt: Date }
): { title: string; body: string } {
  try {
    const parsed = JSON.parse(notification.content);
    const title = parsed.title ?? notification.type.replace(/_/g, " ");
    const details = parsed.message ?? parsed.body ?? "";
    return {
      title,
      body: details,
    };
  } catch {
    return {
      title: notification.type.replace(/_/g, " "),
      body: notification.content,
    };
  }
}

function buildDigestHtml(options: {
  userName: string;
  frequency: NotificationDigestFrequency;
  items: Array<{ title: string; body: string; createdAt: Date }>;
}): string {
  const heading =
    options.frequency === "DAILY"
      ? "Your daily Sports Trivia highlights"
      : "Your weekly Sports Trivia highlights";

  const listItems = options.items
    .map(
      (item) => `
      <li style="margin-bottom:16px;">
        <strong>${item.title}</strong><br />
        <span style="color:#475467;">${item.body}</span><br />
        <small style="color:#98A2B3;">${item.createdAt.toLocaleString()}</small>
      </li>
    `
    )
    .join("");

  const dashboardUrl = `${appBaseUrl}/profile/me`;
  const preferencesUrl = `${appBaseUrl}/profile/me?tab=settings`;

  return `
    <!doctype html>
    <html>
      <body style="font-family:Inter,Arial,sans-serif;background-color:#F8FAFC;padding:32px;color:#1F2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:32px;">
          <tr>
            <td>
              <h1 style="margin:0 0 12px 0;font-size:24px;">Hi ${options.userName || "there"},</h1>
              <p style="margin:0 0 24px 0;color:#475467;">${heading}</p>
              <ul style="padding-left:20px;margin:0 0 24px 0;">
                ${listItems || "<li>No new activity. Jump back in to keep your streak alive!</li>"}
              </ul>
              <a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background-color:#2563EB;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">View my dashboard</a>
              <p style="margin-top:32px;font-size:12px;color:#98A2B3;">
                You can adjust your notification preferences at any time from your <a href="${preferencesUrl}" style="color:#2563EB;">profile settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function runDigestJob(
  frequency: NotificationDigestFrequency,
  referenceDate: Date = new Date()
): Promise<void> {
  const preferences = await getUsersDueForDigest(frequency, referenceDate);
  if (preferences.length === 0) {
    return;
  }

  const since = new Date(referenceDate);
  since.setHours(0, 0, 0, 0);
  if (frequency === "DAILY") {
    since.setDate(since.getDate() - 1);
  } else {
    since.setDate(since.getDate() - 7);
  }

  for (const preference of preferences) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: preference.userId },
        select: { id: true, email: true, name: true },
      });

      if (!user?.email) {
        continue;
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: preference.userId,
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      if (notifications.length === 0) {
        await markDigestSent(preference.userId, referenceDate);
        continue;
      }

      const items = notifications.map((notification) => {
        const text = formatNotificationContent(notification);
        return {
          ...text,
          createdAt: notification.createdAt,
        };
      });

      const html = buildDigestHtml({
        userName: user.name ?? user.email.split("@")[0],
        frequency,
        items,
      });

      await sendDigestEmail({
        to: user.email,
        subject:
          frequency === "DAILY"
            ? "Your daily Sports Trivia digest"
            : "Your weekly Sports Trivia digest",
        html,
      });

      await markDigestSent(preference.userId, referenceDate);
    } catch (error) {
      console.error("[digest] Failed to send digest for user", preference.userId, error);
    }
  }
}
