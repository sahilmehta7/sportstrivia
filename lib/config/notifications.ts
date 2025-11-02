export function getPushConfig() {
  return {
    publicKey: process.env.NEXT_PUBLIC_PUSH_PUBLIC_KEY ?? process.env.PUSH_PUBLIC_KEY ?? "",
    privateKey: process.env.PUSH_PRIVATE_KEY ?? "",
    subject: process.env.PUSH_SUBJECT ?? "mailto:support@sportstrivia.in",
  };
}

export function isPushConfigured(): boolean {
  const config = getPushConfig();
  return Boolean(config.publicKey && config.privateKey);
}

export function getNotificationFeatureFlag(): boolean {
  return process.env.NOTIFICATIONS_PUSH_ENABLED !== "false";
}

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY || process.env.RESEND_API_TOKEN;
}

export function getDigestFromAddress(): string {
  return process.env.NOTIFICATION_DIGEST_FROM || "notifications@sportstrivia.in";
}

export function getDigestReplyToAddress(): string | undefined {
  return process.env.NOTIFICATION_DIGEST_REPLY_TO || undefined;
}
