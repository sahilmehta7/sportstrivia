import { Inngest } from "inngest";

// Check for Event Schemas to be strongly typed if possible, but for now we used loose types for speed
export const inngest = new Inngest({
    id: "sportstrivia-app",
    // We can add middleware here later for logging/sentry
});
