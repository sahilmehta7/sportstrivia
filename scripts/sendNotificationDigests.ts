#!/usr/bin/env tsx

import { NotificationDigestFrequency } from "@prisma/client";
import { runDigestJob } from "@/lib/jobs/digest.job";

const frequencyArg = (process.argv[2] || "DAILY").toUpperCase() as NotificationDigestFrequency;

if (!["DAILY", "WEEKLY"].includes(frequencyArg)) {
  console.error("Invalid frequency. Use DAILY or WEEKLY.");
  process.exit(1);
}

runDigestJob(frequencyArg)
  .then(() => {
    console.log(`[digest] Completed ${frequencyArg} digest run`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("[digest] Digest run failed", error);
    process.exit(1);
  });
