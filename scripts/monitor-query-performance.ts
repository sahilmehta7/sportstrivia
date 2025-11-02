#!/usr/bin/env tsx
/**
 * Database Query Performance Monitor
 * 
 * Identifies slow and frequently executed queries using pg_stat_statements.
 * Helps prioritize query optimization efforts.
 * 
 * Usage:
 *   tsx scripts/monitor-query-performance.ts
 *   tsx scripts/monitor-query-performance.ts --slow-only
 *   tsx scripts/monitor-query-performance.ts --frequent-only
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QueryStats {
  rolname: string;
  query: string;
  calls: number;
  total_time: number;
  min_time: number;
  max_time: number;
  mean_time: number;
  stddev_time?: number;
  avg_rows?: number;
}

async function getSlowQueries() {
  const query = `
    SELECT 
      auth.rolname,
      statements.query,
      statements.calls,
      statements.total_exec_time + statements.total_plan_time as total_time,
      statements.min_exec_time + statements.min_plan_time as min_time,
      statements.max_exec_time + statements.max_plan_time as max_time,
      statements.mean_exec_time + statements.mean_plan_time as mean_time,
      statements.stddev_exec_time + statements.stddev_plan_time as stddev_time,
      CASE 
        WHEN statements.calls > 0 THEN statements.rows / statements.calls
        ELSE 0
      END as avg_rows
    FROM pg_stat_statements as statements
    INNER JOIN pg_authid as auth ON statements.userid = auth.oid
    WHERE 
      statements.calls > 10
      AND statements.mean_exec_time + statements.mean_plan_time > 10
      AND statements.query NOT LIKE '%pg_stat%'
      AND statements.query NOT LIKE '%pg_catalog%'
    ORDER BY mean_time DESC
    LIMIT 20;
  `;

  return prisma.$queryRawUnsafe<QueryStats[]>(query);
}

async function getFrequentQueries() {
  const query = `
    SELECT 
      auth.rolname,
      statements.query,
      statements.calls,
      statements.total_exec_time + statements.total_plan_time as total_time,
      statements.min_exec_time + statements.min_plan_time as min_time,
      statements.max_exec_time + statements.max_plan_time as max_time,
      statements.mean_exec_time + statements.mean_plan_time as mean_time,
      statements.stddev_exec_time + statements.stddev_plan_time as stddev_time,
      CASE 
        WHEN statements.calls > 0 THEN statements.rows / statements.calls
        ELSE 0
      END as avg_rows
    FROM pg_stat_statements as statements
    INNER JOIN pg_authid as auth ON statements.userid = auth.oid
    WHERE 
      statements.calls > 50
      AND statements.query NOT LIKE '%pg_stat%'
      AND statements.query NOT LIKE '%pg_catalog%'
    ORDER BY calls DESC
    LIMIT 20;
  `;

  return prisma.$queryRawUnsafe<QueryStats[]>(query);
}

async function getTopQueriesByTotalTime() {
  const query = `
    SELECT 
      auth.rolname,
      statements.query,
      statements.calls,
      statements.total_exec_time + statements.total_plan_time as total_time,
      statements.min_exec_time + statements.min_plan_time as min_time,
      statements.max_exec_time + statements.max_plan_time as max_time,
      statements.mean_exec_time + statements.mean_plan_time as mean_time,
      statements.stddev_exec_time + statements.stddev_plan_time as stddev_time,
      CASE 
        WHEN statements.calls > 0 THEN statements.rows / statements.calls
        ELSE 0
      END as avg_rows,
      to_char(
        (
          (statements.total_exec_time + statements.total_plan_time) / sum(
            statements.total_exec_time + statements.total_plan_time
          ) over ()
        ) * 100,
        'FM90D0'
      ) || '%' as prop_total_time
    FROM pg_stat_statements as statements
    INNER JOIN pg_authid as auth ON statements.userid = auth.oid
    WHERE 
      statements.query NOT LIKE '%pg_stat%'
      AND statements.query NOT LIKE '%pg_catalog%'
    ORDER BY total_time DESC
    LIMIT 20;
  `;

  return prisma.$queryRawUnsafe<(QueryStats & { prop_total_time: string })[]>(query);
}

function truncateQuery(query: string, maxLength: number = 100): string {
  if (query.length <= maxLength) return query;
  return query.substring(0, maxLength - 3) + '...';
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  const args = process.argv.slice(2);
  const slowOnly = args.includes('--slow-only');
  const frequentOnly = args.includes('--frequent-only');

  console.log('\n⚡ Database Query Performance Report\n');
  console.log('='.repeat(100));

  try {
    if (slowOnly) {
      console.log('\n🐌 SLOW QUERIES (mean execution time > 10ms)\n');
      const slowQueries = await getSlowQueries();

      if (slowQueries.length === 0) {
        console.log('✅ No slow queries found!\n');
        return;
      }

      console.log(
        'Calls'.padStart(10) +
        'Mean'.padStart(12) +
        'Max'.padStart(12) +
        'Total'.padStart(12) +
        'Role'.padStart(15) +
        'Query (truncated)'
      );
      console.log('-'.repeat(100));

      slowQueries.forEach((q) => {
        console.log(
          q.calls.toLocaleString().padStart(10) +
          formatTime(q.mean_time).padStart(12) +
          formatTime(q.max_time).padStart(12) +
          formatTime(q.total_time).padStart(12) +
          q.rolname.padStart(15) +
          ' ' + truncateQuery(q.query, 45)
        );
      });

    } else if (frequentOnly) {
      console.log('\n🔄 MOST FREQUENT QUERIES (>50 calls)\n');
      const frequentQueries = await getFrequentQueries();

      if (frequentQueries.length === 0) {
        console.log('No frequent queries found.\n');
        return;
      }

      console.log(
        'Calls'.padStart(12) +
        'Mean'.padStart(12) +
        'Total'.padStart(12) +
        'Avg Rows'.padStart(12) +
        'Role'.padStart(15) +
        'Query (truncated)'
      );
      console.log('-'.repeat(100));

      frequentQueries.forEach((q) => {
        const avgRows = q.avg_rows 
          ? (typeof q.avg_rows === 'bigint' ? Number(q.avg_rows) : q.avg_rows)
          : null;
        console.log(
          q.calls.toLocaleString().padStart(12) +
          formatTime(q.mean_time).padStart(12) +
          formatTime(q.total_time).padStart(12) +
          (avgRows ? Math.round(avgRows).toString() : 'N/A').padStart(12) +
          q.rolname.padStart(15) +
          ' ' + truncateQuery(q.query, 40)
        );
      });

    } else {
      console.log('\n📊 TOP QUERIES BY TOTAL EXECUTION TIME\n');
      const topQueries = await getTopQueriesByTotalTime();

      if (topQueries.length === 0) {
        console.log('No query statistics available.\n');
        return;
      }

      console.log(
        '% Total'.padStart(10) +
        'Calls'.padStart(12) +
        'Mean'.padStart(12) +
        'Total'.padStart(12) +
        'Role'.padStart(15) +
        'Query (truncated)'
      );
      console.log('-'.repeat(100));

      topQueries.forEach((q) => {
        console.log(
          q.prop_total_time.padStart(10) +
          q.calls.toLocaleString().padStart(12) +
          formatTime(q.mean_time).padStart(12) +
          formatTime(q.total_time).padStart(12) +
          q.rolname.padStart(15) +
          ' ' + truncateQuery(q.query, 40)
        );
      });
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n💡 Optimization Tips:');
    console.log('  • Focus on queries with high total_time and high % total');
    console.log('  • Queries with high calls but low mean_time are usually OK');
    console.log('  • Look for queries that could benefit from indexes');
    console.log('  • Consider query result caching for frequent, rarely-changing data');
    console.log('  • Review N+1 query patterns and optimize with batch queries');
    console.log('\n  Usage:');
    console.log('    --slow-only      Show only slow queries (>10ms mean)');
    console.log('    --frequent-only  Show only frequently called queries (>50 calls)');
    console.log('\n');

  } catch (error: any) {
    if (error.message?.includes('pg_stat_statements')) {
      console.error('❌ Error: pg_stat_statements extension may not be enabled');
      console.error('   Enable it with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;');
    } else {
      console.error('❌ Error fetching query statistics:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

