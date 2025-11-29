/**
 * Feature flag for the new quiz UI experience
 * Set NEXT_PUBLIC_ENABLE_NEW_QUIZ_UI=true to enable
 * Defaults to false for safe rollout
 */
export const ENABLE_NEW_QUIZ_UI =
  process.env.NEXT_PUBLIC_ENABLE_NEW_QUIZ_UI === "true";
