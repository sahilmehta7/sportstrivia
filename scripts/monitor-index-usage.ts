#!/usr/bin/env tsx
/**
 * Database Index Usage Monitor
 * 
 * Identifies unused indexes that can be removed to free up space.
 * Run weekly to track index usage patterns.
 * 
 * Usage:
 *   tsx scripts/monitor-index-usage.ts
 *   tsx scripts/monitor-index-usage.ts --unused-only
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IndexStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  index_scans: number;
  index_size: string;
  index_size_bytes: number;
}

async function getIndexUsage(showUnusedOnly: boolean = false) {
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      pg_relation_size(indexrelid) as index_size_bytes
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      ${showUnusedOnly ? 'AND idx_scan = 0' : ''}
    ORDER BY 
      ${showUnusedOnly ? 'pg_relation_size(indexrelid) DESC' : 'idx_scan DESC, pg_relation_size(indexrelid) DESC'};
  `;

  const result = await prisma.$queryRawUnsafe<IndexStats[]>(query);
  return result;
}

async function getTableStats() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 20;
  `;

  return prisma.$queryRawUnsafe(query);
}

async function main() {
  const args = process.argv.slice(2);
  const showUnusedOnly = args.includes('--unused-only');

  console.log('\n📊 Database Index Usage Report\n');
  console.log('=' .repeat(80));

  try {
    // Get index statistics
    const indexStats = await getIndexUsage(showUnusedOnly);

    if (indexStats.length === 0) {
      console.log('\n✅ No unused indexes found (or no indexes match criteria)\n');
      return;
    }

    if (showUnusedOnly) {
      console.log(`\n⚠️  UNUSED INDEXES (${indexStats.length} total)\n`);
      console.log('These indexes have never been used and are candidates for removal.\n');
      
      // Calculate total wasted space
      const totalWastedSpace = indexStats.reduce((sum, idx) => sum + Number(idx.index_size_bytes), 0);
      console.log(`💾 Total wasted space: ${formatBytes(totalWastedSpace)}\n`);
    } else {
      console.log(`\n📈 ALL INDEXES (Top 30 by usage)\n`);
    }

    // Display index statistics
    console.log(
      'Table'.padEnd(30) +
      'Index Name'.padEnd(40) +
      'Scans'.padStart(10) +
      'Size'.padStart(12)
    );
    console.log('-'.repeat(92));

    indexStats.slice(0, showUnusedOnly ? undefined : 30).forEach((idx) => {
      const scans = idx.index_scans.toLocaleString();
      const warning = idx.index_scans === 0 ? ' ⚠️' : '';
      
      console.log(
        idx.tablename.padEnd(30) +
        idx.indexname.padEnd(40) +
        scans.padStart(10) +
        idx.index_size.padStart(12) +
        warning
      );
    });

    // Show table statistics
    if (!showUnusedOnly) {
      console.log('\n\n📋 TOP TABLES BY SIZE (including indexes)\n');
      const tableStats = await getTableStats();
      
      console.log(
        'Table'.padEnd(30) +
        'Total Size'.padStart(15) +
        'Table Size'.padStart(15) +
        'Indexes Size'.padStart(15)
      );
      console.log('-'.repeat(75));
      
      (tableStats as any[]).forEach((table: any) => {
        console.log(
          table.tablename.padEnd(30) +
          String(table.total_size || 'N/A').padStart(15) +
          String(table.table_size || 'N/A').padStart(15) +
          String(table.indexes_size || 'N/A').padStart(15)
        );
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Recommendations:');
    if (showUnusedOnly) {
      console.log('  • Review each unused index before removing');
      console.log('  • Check if index might be needed for future features');
      console.log('  • Verify index is truly unused (run for 2+ weeks)');
      console.log('  • Small indexes (<1MB) might be worth keeping "just in case"');
    } else {
      console.log('  • Run with --unused-only to see only unused indexes');
      console.log('  • Monitor weekly to track index usage trends');
      console.log('  • Remove unused indexes after 2+ weeks of monitoring');
    }
    console.log('\n');

  } catch (error) {
    console.error('❌ Error fetching index statistics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

main();

