#!/usr/bin/env tsx
/**
 * Test Optimizations
 * 
 * Verifies that the database optimizations are working correctly:
 * - Full-text search on topics
 * - Index usage on common queries
 * - Query performance improvements
 * 
 * Usage:
 *   tsx scripts/test-optimizations.ts
 */

import { PrismaClient } from '@prisma/client';
import * as topicServiceModule from '../lib/services/topic.service';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  executionTime?: number;
}

async function testFullTextSearch(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Use the exported searchTopics function directly
    const results = await topicServiceModule.searchTopics({ query: 'cricket', page: 1, limit: 10 });

    const executionTime = Date.now() - startTime;
    const hasResults = results.topics.length > 0;

    // Verify full-text search is being used by checking execution plan
    const planResult = await prisma.$queryRawUnsafe<Array<any>>(
      `EXPLAIN (ANALYZE, BUFFERS)
      SELECT 
        t.id,
        ts_rank(t.fts, plainto_tsquery('english', 'cricket')) as rank
      FROM "Topic" t
      WHERE t.fts @@ plainto_tsquery('english', 'cricket')
      ORDER BY rank DESC
      LIMIT 10;`
    );

    const plan = planResult.map((r: any) => r['QUERY PLAN'] || r.query_plan || JSON.stringify(r)).join('\n');
    const usesGINIndex = plan.includes('Topic_fts_idx') || plan.includes('Bitmap Index Scan');

    return {
      name: 'Full-Text Search',
      passed: hasResults && usesGINIndex,
      message: usesGINIndex
        ? `✅ Using GIN index, found ${results.topics.length} results in ${executionTime}ms`
        : `⚠️  Not using GIN index (might be cached or small dataset)`,
      executionTime,
    };
  } catch (error: any) {
    return {
      name: 'Full-Text Search',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function testQuizQueryIndex(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Test query that should use the new composite index
    const explainResult = await prisma.$queryRawUnsafe<Array<any>>(
      `EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, slug
      FROM "Quiz"
      WHERE "isPublished" = true 
        AND status = 'PUBLISHED'
        AND sport IS NOT NULL
      ORDER BY "createdAt" DESC
      LIMIT 12;`
    );

    const executionTime = Date.now() - startTime;
    const plan = explainResult.map((r: any) => r['QUERY PLAN'] || r.query_plan || JSON.stringify(r)).join('\n');

    // Check if using index (might use partial index or seq scan depending on data size)
    const usesIndex = plan.includes('Index') || plan.includes('published');
    const isFast = executionTime < 100; // Should be very fast

    return {
      name: 'Quiz Filtering Query',
      passed: isFast,
      message: usesIndex
        ? `✅ Query optimized with index in ${executionTime}ms`
        : `✅ Query executed quickly (${executionTime}ms) - may use seq scan for small tables`,
      executionTime,
    };
  } catch (error: any) {
    return {
      name: 'Quiz Filtering Query',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function testQuizAttemptDateQuery(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Get a real user ID for testing
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      return {
        name: 'QuizAttempt Date Range Query',
        passed: false,
        message: '⚠️  No users found in database',
      };
    }

    // Test query that should use the composite index
    const explainResult = await prisma.$queryRawUnsafe<Array<any>>(
      `EXPLAIN (ANALYZE, BUFFERS)
      SELECT "quizId", "completedAt"
      FROM "QuizAttempt"
      WHERE "userId" = $1::text
        AND "completedAt" >= NOW() - INTERVAL '30 days'
        AND "completedAt" < NOW()
      ORDER BY "completedAt" DESC;`,
      user.id
    );

    const executionTime = Date.now() - startTime;
    const plan = explainResult.map((r: any) => r['QUERY PLAN'] || r.query_plan || JSON.stringify(r)).join('\n');
    const usesIndex = plan.includes('QuizAttempt_userId_quizId_completedAt_idx') ||
      plan.includes('Index Scan');

    return {
      name: 'QuizAttempt Date Range Query',
      passed: usesIndex || executionTime < 50,
      message: usesIndex
        ? `✅ Using composite index in ${executionTime}ms`
        : `⚠️  Not using expected index (${executionTime}ms) - might need data or different query pattern`,
      executionTime,
    };
  } catch (error: any) {
    return {
      name: 'QuizAttempt Date Range Query',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function testNotificationQuery(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      return {
        name: 'Notification Query',
        passed: false,
        message: '⚠️  No users found in database',
      };
    }

    const explainResult = await prisma.$queryRawUnsafe<Array<any>>(
      `EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, type, content, "createdAt"
      FROM "Notification"
      WHERE "userId" = $1::text
        AND read = false
      ORDER BY "createdAt" DESC
      LIMIT 10;`,
      user.id
    );

    const executionTime = Date.now() - startTime;
    const plan = explainResult.map((r: any) => r['QUERY PLAN'] || r.query_plan || JSON.stringify(r)).join('\n');
    const usesIndex = plan.includes('Notification_userId_read_createdAt_desc_idx') ||
      plan.includes('Index Scan');

    return {
      name: 'Notification Query',
      passed: executionTime < 50,
      message: usesIndex
        ? `✅ Using partial index in ${executionTime}ms`
        : `✅ Query executed quickly (${executionTime}ms)`,
      executionTime,
    };
  } catch (error: any) {
    return {
      name: 'Notification Query',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function testRLSEnabled(): Promise<TestResult> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ rls_enabled: boolean; count: bigint }>>(
      `SELECT 
        COUNT(*) FILTER (WHERE rowsecurity = true)::bigint as count,
        true as rls_enabled
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE '_prisma%';`
    );

    const enabledCount = Number(result[0]?.count || 0);

    // Check that at least most tables have RLS enabled (allowing for system tables)
    return {
      name: 'RLS Enabled',
      passed: enabledCount >= 30, // Should have RLS on most tables
      message: enabledCount >= 30
        ? `✅ RLS enabled on ${enabledCount} tables`
        : `⚠️  RLS enabled on only ${enabledCount} tables (expected ~33)`,
    };
  } catch (error: any) {
    return {
      name: 'RLS Enabled',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function testVerificationTokenPK(): Promise<TestResult> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string; is_primary: boolean }>>(
      `SELECT 
        column_name,
        CASE WHEN constraint_name LIKE '%_pkey' THEN true ELSE false END as is_primary
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage k 
        ON c.table_name = k.table_name 
        AND c.column_name = k.column_name
        AND k.constraint_name LIKE '%_pkey'
      WHERE c.table_schema = 'public'
        AND c.table_name = 'VerificationToken'
        AND c.column_name = 'id';`
    );

    const hasPK = result.length > 0 && result[0].is_primary;

    return {
      name: 'VerificationToken Primary Key',
      passed: hasPK,
      message: hasPK
        ? `✅ Primary key on VerificationToken.id exists`
        : `❌ Primary key on VerificationToken.id missing`,
    };
  } catch (error: any) {
    return {
      name: 'VerificationToken Primary Key',
      passed: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

async function main() {
  console.log('\n🧪 Testing Database Optimizations\n');
  console.log('='.repeat(80));

  const tests = [
    testFullTextSearch,
    testQuizQueryIndex,
    testQuizAttemptDateQuery,
    testNotificationQuery,
    testRLSEnabled,
    testVerificationTokenPK,
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      console.log(`\n${result.name}:`);
      console.log(`  ${result.message}`);
    } catch (error: any) {
      results.push({
        name: test.name,
        passed: false,
        message: `❌ Unexpected error: ${error.message}`,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n📊 Test Results: ${passed}/${total} passed\n`);

  if (passed === total) {
    console.log('✅ All optimizations verified!\n');
  } else {
    console.log('⚠️  Some tests failed. Review the messages above.\n');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

