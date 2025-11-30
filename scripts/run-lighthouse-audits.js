#!/usr/bin/env node
/**
 * Lighthouse Audit Script
 * 
 * Runs comprehensive Lighthouse audits on all public pages
 * Supports both localhost and production environments
 * 
 * Usage:
 *   node scripts/run-lighthouse-audits.js localhost
 *   node scripts/run-lighthouse-audits.js production
 *   node scripts/run-lighthouse-audits.js all
 */

const lighthouseModule = require('lighthouse');
const lighthouse = lighthouseModule.default || lighthouseModule;
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

const PAGES_TO_AUDIT = [
  { path: '/', name: 'home' },
  { path: '/quizzes', name: 'quizzes' },
  { path: '/topics', name: 'topics' },
  { path: '/leaderboard', name: 'leaderboard' },
  { path: '/search', name: 'search' },
  { path: '/random-quiz', name: 'random-quiz' },
  { path: '/challenges', name: 'challenges' },
  { path: '/friends', name: 'friends' },
  { path: '/notifications', name: 'notifications' },
];

const ENVIRONMENTS = {
  localhost: 'http://localhost:3200',
  production: 'https://www.sportstrivia.in',
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory might already exist, ignore
  }
}

async function runLighthouseAudit(url, pageName, outputDir, chrome) {
  console.log(`\n🔍 Auditing ${pageName} (${url})...`);

  try {
    const options = {
      logLevel: 'info',
      output: ['html', 'json'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      disableStorageReset: false,
    };

    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
        },
      },
    };

    const runnerResult = await lighthouse(url, options, config);

    if (!runnerResult) {
      throw new Error('Lighthouse returned no results');
    }

    const lhr = runnerResult.lhr;
    const categories = lhr.categories;

    const result = {
      page: pageName,
      url,
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      htmlReportPath: path.join(outputDir, `${pageName}.html`),
      jsonReportPath: path.join(outputDir, `${pageName}.json`),
    };

    // Save HTML report
    const htmlReport = runnerResult.report[0];
    await fs.writeFile(result.htmlReportPath, htmlReport);

    // Save JSON report
    const jsonReport = runnerResult.report[1];
    await fs.writeFile(result.jsonReportPath, jsonReport);

    console.log(`✅ ${pageName}: Performance=${result.performance}, Accessibility=${result.accessibility}, Best Practices=${result.bestPractices}, SEO=${result.seo}`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error auditing ${pageName}: ${errorMessage}`);
    
    return {
      page: pageName,
      url,
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      htmlReportPath: '',
      jsonReportPath: '',
      error: errorMessage,
    };
  }
}

async function runAuditsForEnvironment(environment) {
  const baseUrl = ENVIRONMENTS[environment];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const reportsDir = path.join(process.cwd(), 'lighthouse-reports', environment, timestamp);

  await ensureDirectoryExists(reportsDir);

  console.log(`\n🚀 Starting Lighthouse audits for ${environment}...`);
  console.log(`📁 Reports will be saved to: ${reportsDir}`);

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const results = [];

  try {
    for (const page of PAGES_TO_AUDIT) {
      const url = `${baseUrl}${page.path}`;
      const result = await runLighthouseAudit(url, page.name, reportsDir, chrome);
      results.push(result);
      
      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Calculate averages
    const successfulResults = results.filter(r => !r.error);
    const avgPerformance = successfulResults.length > 0
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.performance, 0) / successfulResults.length)
      : 0;
    const avgAccessibility = successfulResults.length > 0
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.accessibility, 0) / successfulResults.length)
      : 0;
    const avgBestPractices = successfulResults.length > 0
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.bestPractices, 0) / successfulResults.length)
      : 0;
    const avgSeo = successfulResults.length > 0
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.seo, 0) / successfulResults.length)
      : 0;

    // Create summary
    const summary = {
      environment,
      timestamp: new Date().toISOString(),
      baseUrl,
      totalPages: PAGES_TO_AUDIT.length,
      successfulAudits: successfulResults.length,
      failedAudits: results.filter(r => r.error).length,
      averageScores: {
        performance: avgPerformance,
        accessibility: avgAccessibility,
        bestPractices: avgBestPractices,
        seo: avgSeo,
      },
      results: results.map(r => ({
        page: r.page,
        url: r.url,
        scores: {
          performance: r.performance,
          accessibility: r.accessibility,
          bestPractices: r.bestPractices,
          seo: r.seo,
        },
        error: r.error,
      })),
    };

    // Save summary
    const summaryPath = path.join(reportsDir, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n📊 Summary for ${environment}:`);
    console.log(`   Average Performance: ${avgPerformance}`);
    console.log(`   Average Accessibility: ${avgAccessibility}`);
    console.log(`   Average Best Practices: ${avgBestPractices}`);
    console.log(`   Average SEO: ${avgSeo}`);
    console.log(`   Successful: ${successfulResults.length}/${PAGES_TO_AUDIT.length}`);
    console.log(`\n✅ Reports saved to: ${reportsDir}`);
  } finally {
    await chrome.kill();
  }
}

async function main() {
  const environmentArg = process.argv[2];

  if (!environmentArg || !['localhost', 'production', 'all'].includes(environmentArg)) {
    console.error('Usage: node scripts/run-lighthouse-audits.js [localhost|production|all]');
    process.exit(1);
  }

  if (environmentArg === 'all') {
    await runAuditsForEnvironment('localhost');
    await runAuditsForEnvironment('production');
  } else {
    await runAuditsForEnvironment(environmentArg);
  }

  console.log('\n✨ All audits completed!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

