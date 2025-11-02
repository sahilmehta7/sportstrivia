#!/usr/bin/env tsx

import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();

console.log("PUSH_PUBLIC_KEY=", vapidKeys.publicKey);
console.log("PUSH_PRIVATE_KEY=", vapidKeys.privateKey);
