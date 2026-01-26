import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting cleanup of test users...");

    const testUserEmails = [
        "john@example.com",
        "jane@example.com",
        "mod@sportstrivia.com",
        "sarah@example.com"
    ];

    // Also include users created with test- prefix
    const testUsers = await prisma.user.findMany({
        where: {
            OR: [
                { email: { in: testUserEmails } },
                { email: { startsWith: "test-" } }
            ]
        },
        select: { id: true, email: true }
    });

    console.log(`Found ${testUsers.length} test users to remove.`);

    for (const user of testUsers) {
        console.log(`Deleting user: ${user.email} (${user.id})`);

        // Cascade delete should handle related entities if schema is configured correctly.
        // However, some might need manual cleanup if relations are not ON DELETE CASCADE.
        // Based on verify script errors, we should be careful.

        await prisma.user.delete({
            where: { id: user.id }
        });
    }

    console.log("Cleanup completed successfully!");
}

main()
    .catch((e) => {
        console.error("Error during cleanup:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
