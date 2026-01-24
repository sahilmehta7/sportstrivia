
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const key = "ai_quiz_prompt";
        console.log("Checking for existing prompt in DB...");
        const existing = await prisma.appSettings.findUnique({ where: { key } });

        if (existing) {
            console.log("Found custom prompt in database:");
            console.log(existing.value.substring(0, 100) + "...");

            console.log("Deleting custom prompt to force usage of code default...");
            await prisma.appSettings.delete({ where: { key } });
            console.log("✅ Successfully deleted custom prompt. System will now use the new code default.");
        } else {
            console.log("ℹ️ No custom prompt found in DB. System should already be using code default.");
        }
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
