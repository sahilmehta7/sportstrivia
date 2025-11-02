#!/usr/bin/env tsx
/**
 * Database Health Monitor
 * 
 * Comprehensive database health check including:
 * - Table sizes and growth
 * - Index health
 * - Connection statistics
 * - RLS policy status
 * - Recent query performance
 * 
 * Usage:
 *   tsx scripts/monitor-db-health.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTableSizes() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as total_size,
      pg_size_pretty(pg_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as table_size,
      pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) - pg_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as indexes_size,
      pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) as total_size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) DESC;
  `;

  return prisma.$queryRawUnsafe(query);
}

async function getRLSStatus() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      rowsecurity as rls_enabled,
      (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
  `;

  return prisma.$queryRawUnsafe(query);
}

async function getConnectionStats() {
  const query = `
    SELECT 
      COUNT(*) as total_connections,
      COUNT(*) FILTER (WHERE state = 'active') as active_connections,
      COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
      COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
      COUNT(*) FILTER (WHERE state = 'idle in transaction (aborted)') as idle_in_transaction_aborted
    FROM pg_stat_activity
    WHERE datname = current_database();
  `;

  return prisma.$queryRawUnsafe(query);
}

async function getIndexHealth() {
  const query = `
    SELECT 
      COUNT(*) as total_indexes,
      COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes,
      pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size,
      pg_size_pretty(SUM(CASE WHEN idx_scan = 0 THEN pg_relation_size(indexrelid) ELSE 0 END)) as unused_index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public';
  `;

  return prisma.$queryRawUnsafe(query);
}

async function getQueryStats() {
  const query = `
    SELECT 
      COUNT(DISTINCT queryid) as unique_queries,
      SUM(calls) as total_calls,
      AVG(mean_exec_time + mean_plan_time) as avg_execution_time,
      MAX(max_exec_time + max_plan_time) as max_execution_time,
      SUM(total_exec_time + total_plan_time) as total_time
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat%';
  `;

  return prisma.$queryRawUnsafe(query);
}

async function main() {
  console.log('\n🏥 Database Health Report\n');
  console.log('='.repeat(80));

  try {
    // Connection Statistics
    console.log('\n📡 Connection Statistics\n');
    const connStats = await getConnectionStats();
    const conn = (connStats as any[])[0];
    console.log(`  Total Connections:        ${conn.total_connections}`);
    console.log(`  Active:                   ${conn.active_connections}`);
    console.log(`  Idle:                     ${conn.idle_connections}`);
    console.log(`  Idle in Transaction:      ${conn.idle_in_transaction} ⚠️`);
    console.log(`  Idle in Transaction (AB): ${conn.idle_in_transaction_aborted} 🚨`);

    if (conn.idle_in_transaction > 0) {
      console.log('\n  ⚠️  Warning: Connections idle in transaction detected!');
      console.log('     This can lead to table bloat and connection pool exhaustion.');
    }

    // Index Health
    console.log('\n📊 Index Health\n');
    const indexHealth = await getIndexHealth();
    const idx = (indexHealth as any[])[0];
    console.log(`  Total Indexes:      ${idx.total_indexes}`);
    console.log(`  Unused Indexes:     ${idx.unused_indexes} ${idx.unused_indexes > 0 ? '⚠️' : '✅'}`);
    console.log(`  Total Index Size:   ${idx.total_index_size}`);
    if (idx.unused_index_size && idx.unused_index_size !== '0 bytes') {
      console.log(`  Unused Index Size:  ${idx.unused_index_size} ⚠️`);
    }

    // RLS Status
    console.log('\n🔒 Row Level Security Status\n');
    const rlsStatus = await getRLSStatus();
    const rlsTables = rlsStatus as any[];
    const enabledCount = rlsTables.filter((t: any) => t.rls_enabled).length;
    const withPolicies = rlsTables.filter((t: any) => t.policy_count > 0).length;
    
    console.log(`  Tables with RLS Enabled: ${enabledCount}/${rlsTables.length}`);
    console.log(`  Tables with Policies:    ${withPolicies}/${rlsTables.length}`);

    if (enabledCount < rlsTables.length) {
      console.log(`  ⚠️  Warning: ${rlsTables.length - enabledCount} tables without RLS enabled`);
    }

    // Table Sizes (Top 10)
    console.log('\n💾 Largest Tables (Top 10)\n');
    const tableSizes = await getTableSizes();
    const tables = tableSizes as any[];
    
    console.log(
      'Table'.padEnd(30) +
      'Total Size'.padStart(15) +
      'Table Size'.padStart(15) +
      'Indexes Size'.padStart(15)
    );
    console.log('-'.repeat(75));

    tables.slice(0, 10).forEach((table: any) => {
      console.log(
        table.tablename.padEnd(30) +
        String(table.total_size || 'N/A').padStart(15) +
        String(table.table_size || 'N/A').padStart(15) +
        String(table.indexes_size || 'N/A').padStart(15)
      );
    });

    // Query Statistics
    console.log('\n⚡ Query Performance Summary\n');
    const queryStats = await getQueryStats();
    const qStats = (queryStats as any[])[0];
    
    if (qStats && qStats.unique_queries) {
      console.log(`  Unique Queries:       ${qStats.unique_queries.toLocaleString()}`);
      console.log(`  Total Executions:     ${qStats.total_calls.toLocaleString()}`);
      console.log(`  Avg Execution Time:   ${(qStats.avg_execution_time || 0).toFixed(2)}ms`);
      console.log(`  Max Execution Time:   ${(qStats.max_execution_time || 0).toFixed(2)}ms`);
      
      if (qStats.avg_execution_time > 100) {
        console.log('  ⚠️  Warning: Average execution time is high');
      }
    } else {
      console.log('  No query statistics available (pg_stat_statements may need more data)');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Health Check Complete\n');

    const warnings: string[] = [];
    if (conn.idle_in_transaction > 0) warnings.push('Connections idle in transaction');
    if (idx.unused_indexes > 20) warnings.push('Many unused indexes detected');
    if (qStats?.avg_execution_time > 100) warnings.push('High average query execution time');
    if (enabledCount < rlsTables.length) warnings.push('Some tables missing RLS');

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach((w) => console.log(`  - ${w}`));
      console.log('');
    } else {
      console.log('🎉 Database looks healthy!\n');
    }

    console.log('💡 Run detailed reports:');
    console.log('  tsx scripts/monitor-index-usage.ts --unused-only');
    console.log('  tsx scripts/monitor-query-performance.ts --slow-only');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error generating health report:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

