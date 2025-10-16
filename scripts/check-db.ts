import { prisma } from "../lib/db";

async function checkDatabase() {
  console.log("Checking database connection...");
  
  try {
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log("\n📋 Existing tables:");
    console.log(tables);

    // Check critical NextAuth tables
    const userCount = await prisma.user.count();
    console.log(`\n✅ User table exists (${userCount} users)`);

    const sessionCount = await prisma.session.count();
    console.log(`✅ Session table exists (${sessionCount} sessions)`);

    const accountCount = await prisma.account.count();
    console.log(`✅ Account table exists (${accountCount} accounts)`);

  } catch (error: any) {
    console.error("❌ Database check failed:", error.message);
    
    if (error.message.includes("does not exist")) {
      console.error("\n🔴 MISSING TABLES DETECTED!");
      console.error("Run: npx prisma db push");
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

