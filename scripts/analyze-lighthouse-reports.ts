#!/usr/bin/env tsx
/**
 * Lighthouse Reports Analysis Script
 * 
 * Analyzes Lighthouse audit reports and generates insights
 * 
 * Usage:
 *   tsx scripts/analyze-lighthouse-reports.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface LighthouseReport {
  categories: {
    performance?: { score: number; auditRefs: Array<{ id: string; weight: number }> };
    accessibility?: { score: number; auditRefs: Array<{ id: string; weight: number }> };
    'best-practices'?: { score: number; auditRefs: Array<{ id: string; weight: number }> };
    seo?: { score: number; auditRefs: Array<{ id: string; weight: number }> };
  };
  audits: Record<string, {
    id: string;
    title: string;
    description: string;
    score: number | null;
    displayValue?: string;
    details?: {
      items?: Array<Record<string, unknown>>;
    };
  }>;
}

interface PageAnalysis {
  page: string;
  environment: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  issues: Array<{
    category: string;
    auditId: string;
    title: string;
    description: string;
    score: number | null;
    impact: 'high' | 'medium' | 'low';
  }>;
  opportunities: Array<{
    auditId: string;
    title: string;
    description: string;
    savings?: number;
    unit?: string;
  }>;
}

interface AnalysisSummary {
  environments: string[];
  totalPages: number;
  averageScores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  commonIssues: Array<{
    auditId: string;
    title: string;
    affectedPages: number;
    averageScore: number;
    category: string;
  }>;
  topOpportunities: Array<{
    auditId: string;
    title: string;
    description: string;
    potentialSavings: number;
    unit: string;
    affectedPages: number;
  }>;
  pageAnalyses: PageAnalysis[];
}

function getImpactFromScore(score: number | null): 'high' | 'medium' | 'low' {
  if (score === null) return 'medium';
  if (score < 0.5) return 'high';
  if (score < 0.9) return 'medium';
  return 'low';
}

function getCategoryWeight(category: string, auditId: string, report: LighthouseReport): number {
  const categoryData = report.categories[category as keyof typeof report.categories];
  if (!categoryData) return 0;
  
  const auditRef = categoryData.auditRefs.find(ref => ref.id === auditId);
  return auditRef?.weight || 0;
}

async function analyzeReport(
  reportPath: string,
  pageName: string,
  environment: string
): Promise<PageAnalysis | null> {
  try {
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const report: LighthouseReport = JSON.parse(reportContent);

    const categories = report.categories;
    const audits = report.audits;

    const scores = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
    };

    const issues: PageAnalysis['issues'] = [];
    const opportunities: PageAnalysis['opportunities'] = [];

    // Analyze all audits
    for (const [auditId, audit] of Object.entries(audits)) {
      if (audit.score === null) continue;

      // Identify issues (low scores)
      if (audit.score < 0.9) {
        let category = 'other';
        if (getCategoryWeight('performance', auditId, report) > 0) category = 'performance';
        else if (getCategoryWeight('accessibility', auditId, report) > 0) category = 'accessibility';
        else if (getCategoryWeight('best-practices', auditId, report) > 0) category = 'best-practices';
        else if (getCategoryWeight('seo', auditId, report) > 0) category = 'seo';

        issues.push({
          category,
          auditId,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          impact: getImpactFromScore(audit.score),
        });
      }

      // Identify opportunities (performance savings)
      // Check for opportunity audits or audits with savings information
      if (auditId.includes('opportunity') || 
          auditId.includes('byte') || 
          auditId.includes('unused') ||
          auditId.includes('minify') ||
          auditId.includes('render-blocking') ||
          (audit.score !== null && audit.score < 0.9 && audit.displayValue)) {
        const savings = extractSavings(audit);
        if (savings) {
          opportunities.push({
            auditId,
            title: audit.title,
            description: audit.description,
            savings: savings.value,
            unit: savings.unit,
          });
        }
      }
    }

    // Sort issues by impact and score
    issues.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return (a.score || 0) - (b.score || 0);
    });

    // Sort opportunities by potential savings
    opportunities.sort((a, b) => (b.savings || 0) - (a.savings || 0));

    return {
      page: pageName,
      environment,
      scores,
      issues: issues.slice(0, 20), // Top 20 issues
      opportunities: opportunities.slice(0, 10), // Top 10 opportunities
    };
  } catch (error) {
    console.error(`Error analyzing ${reportPath}:`, error);
    return null;
  }
}

function extractSavings(audit: LighthouseReport['audits'][string]): { value: number; unit: string } | null {
  if (!audit.displayValue) return null;

  // Try to extract numeric value and unit from displayValue
  const match = audit.displayValue.match(/(\d+(?:\.\d+)?)\s*(ms|s|kb|mb|%)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    // Convert to milliseconds for time-based savings
    if (unit === 's') {
      return { value: value * 1000, unit: 'ms' };
    }
    return { value, unit };
  }

  // Check details.items for savings
  if (audit.details?.items && audit.details.items.length > 0) {
    const firstItem = audit.details.items[0] as Record<string, unknown>;
    if (firstItem.wastedBytes) {
      return { value: Number(firstItem.wastedBytes) / 1024, unit: 'kb' };
    }
    if (firstItem.wastedMs) {
      return { value: Number(firstItem.wastedMs), unit: 'ms' };
    }
  }

  return null;
}

async function findLatestReports(): Promise<Array<{ environment: string; timestamp: string; reportsDir: string }>> {
  const reportsBaseDir = path.join(process.cwd(), 'lighthouse-reports');
  const environments = ['localhost', 'production'];
  const latestReports: Array<{ environment: string; timestamp: string; reportsDir: string }> = [];

  for (const env of environments) {
    const envDir = path.join(reportsBaseDir, env);
    try {
      const entries = await fs.readdir(envDir, { withFileTypes: true });
      const timestamps = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort()
        .reverse();

      if (timestamps.length > 0) {
        latestReports.push({
          environment: env,
          timestamp: timestamps[0],
          reportsDir: path.join(envDir, timestamps[0]),
        });
      }
    } catch {
      // Environment directory doesn't exist yet
      console.warn(`No reports found for ${env}`);
    }
  }

  return latestReports;
}

async function main() {
  console.log('🔍 Analyzing Lighthouse reports...\n');

  const latestReports = await findLatestReports();

  if (latestReports.length === 0) {
    console.error('No Lighthouse reports found. Please run audits first.');
    process.exit(1);
  }

  const pageAnalyses: PageAnalysis[] = [];
  const issueMap = new Map<string, { count: number; totalScore: number; category: string; title: string }>();
  const opportunityMap = new Map<string, { count: number; totalSavings: number; unit: string; title: string; description: string }>();

  // Analyze all reports
  for (const { environment, reportsDir } of latestReports) {
    console.log(`📊 Analyzing ${environment} reports...`);

    try {
      const files = await fs.readdir(reportsDir);
      const jsonReports = files.filter(f => f.endsWith('.json') && f !== 'summary.json');

      for (const reportFile of jsonReports) {
        const pageName = reportFile.replace('.json', '');
        const reportPath = path.join(reportsDir, reportFile);

        const analysis = await analyzeReport(reportPath, pageName, environment);
        if (analysis) {
          pageAnalyses.push(analysis);

          // Aggregate issues
          for (const issue of analysis.issues) {
            const key = `${issue.category}:${issue.auditId}`;
            const existing = issueMap.get(key);
            if (existing) {
              existing.count++;
              existing.totalScore += issue.score || 0;
            } else {
              issueMap.set(key, {
                count: 1,
                totalScore: issue.score || 0,
                category: issue.category,
                title: issue.title,
              });
            }
          }

          // Aggregate opportunities
          for (const opp of analysis.opportunities) {
            const key = opp.auditId;
            const existing = opportunityMap.get(key);
            if (existing) {
              existing.count++;
              existing.totalSavings += opp.savings || 0;
            } else {
              opportunityMap.set(key, {
                count: 1,
                totalSavings: opp.savings || 0,
                unit: opp.unit || 'ms',
                title: opp.title,
                description: opp.description,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${environment}:`, error);
    }
  }

  // Calculate averages
  const totalScores = pageAnalyses.reduce(
    (acc, analysis) => ({
      performance: acc.performance + analysis.scores.performance,
      accessibility: acc.accessibility + analysis.scores.accessibility,
      bestPractices: acc.bestPractices + analysis.scores.bestPractices,
      seo: acc.seo + analysis.scores.seo,
    }),
    { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
  );

  const avgScores = {
    performance: Math.round(totalScores.performance / pageAnalyses.length),
    accessibility: Math.round(totalScores.accessibility / pageAnalyses.length),
    bestPractices: Math.round(totalScores.bestPractices / pageAnalyses.length),
    seo: Math.round(totalScores.seo / pageAnalyses.length),
  };

  // Build common issues list
  const commonIssues = Array.from(issueMap.entries())
    .map(([key, data]) => ({
      auditId: key.split(':')[1],
      title: data.title,
      affectedPages: data.count,
      averageScore: Math.round((data.totalScore / data.count) * 100),
      category: data.category,
    }))
    .sort((a, b) => {
      // Sort by affected pages, then by average score
      if (b.affectedPages !== a.affectedPages) {
        return b.affectedPages - a.affectedPages;
      }
      return a.averageScore - b.averageScore;
    })
    .slice(0, 20);

  // Build top opportunities list
  const topOpportunities = Array.from(opportunityMap.entries())
    .map(([auditId, data]) => ({
      auditId,
      title: data.title,
      description: data.description,
      potentialSavings: Math.round(data.totalSavings / data.count),
      unit: data.unit,
      affectedPages: data.count,
    }))
    .sort((a, b) => b.potentialSavings - a.potentialSavings)
    .slice(0, 15);

  const summary: AnalysisSummary = {
    environments: Array.from(new Set(pageAnalyses.map(a => a.environment))),
    totalPages: pageAnalyses.length,
    averageScores: avgScores,
    commonIssues,
    topOpportunities,
    pageAnalyses,
  };

  // Save analysis
  const analysisPath = path.join(process.cwd(), 'lighthouse-reports', 'analysis.json');
  await fs.writeFile(analysisPath, JSON.stringify(summary, null, 2));

  console.log('\n📈 Analysis Summary:');
  console.log(`   Total Pages Analyzed: ${summary.totalPages}`);
  console.log(`   Average Performance: ${avgScores.performance}`);
  console.log(`   Average Accessibility: ${avgScores.accessibility}`);
  console.log(`   Average Best Practices: ${avgScores.bestPractices}`);
  console.log(`   Average SEO: ${avgScores.seo}`);
  console.log(`   Common Issues Found: ${commonIssues.length}`);
  console.log(`   Top Opportunities: ${topOpportunities.length}`);
  console.log(`\n✅ Analysis saved to: ${analysisPath}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

