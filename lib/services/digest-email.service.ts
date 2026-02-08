import { Resend } from "resend";
import {
  getDigestFromAddress,
  getDigestReplyToAddress,
  getResendApiKey,
} from "@/lib/config/notifications";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendDigestEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[digest] Resend API key not configured, skipping email send");
    return;
  }

  await client.emails.send({
    from: getDigestFromAddress(),
    replyTo: getDigestReplyToAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
