import { scanPage, BrowserPool } from '../packages/scanner/src/index';
import { runLighthouse } from '../packages/lighthouse-engine/src/index';
import { analyzeDom } from '../packages/dom-analyzer/src/index';
import { correlateIssues } from '../packages/root-cause-engine/src/index';
import { generateReport } from '../packages/priority-engine/src/index';

async function main() {
  const url = process.argv[2] || 'https://example.com';
  console.log(`=== STARTING FULL PIPELINE TEST FOR: ${url} ===`);

  try {
    console.log('\n[1/5] Running Playwright Page Scan...');
    const scanResult = await scanPage(url, 'desktop');
    console.log('Playwright Scan Complete!');
    console.log(`- HTML length: ${scanResult.html.length} chars`);
    console.log(`- Requests: ${scanResult.networkRequests.length}`);

    console.log('\n[2/5] Running Lighthouse Audit...');
    const lhResult = await runLighthouse(url, 'desktop');
    console.log('Lighthouse Audit Complete!');
    console.log('Scores:', lhResult.scores);
    console.log('Metrics:', lhResult.metrics);

    console.log('\n[3/5] Running DOM Analysis...');
    const rawIssues = analyzeDom(scanResult);
    console.log(`DOM Analysis Complete! Found ${rawIssues.length} issues.`);

    console.log('\n[4/5] Running Root Cause Correlation...');
    const correlatedIssues = correlateIssues(lhResult, rawIssues);
    console.log(`Correlation Complete! Correlated ${correlatedIssues.length} issues.`);

    console.log('\n[5/5] Prioritizing Issues and Generating Audit Report...');
    const report = await generateReport('test-run-123', url, lhResult, correlatedIssues);
    console.log('=== PIPELINE SUCCESS ===');
    console.log('Report Summary:');
    console.log('- Total Issues:', report.summary.totalIssues);
    console.log('- Critical Count:', report.summary.criticalCount);
    console.log('- High Count:', report.summary.highCount);
    console.log('- Estimated Gain (ms):', report.summary.estimatedGain);
    
    if (report.issues.length > 0) {
      console.log('\nSample Prioritized Issue:');
      const sample = report.issues[0];
      console.log(`- [${sample.priority.toUpperCase()}] ${sample.ruleId} (Score: ${sample.priorityScore})`);
      console.log('  Human Explanation:', sample.explanation.human.explanation);
      console.log('  Developer Fix:', sample.explanation.developer.fix || sample.explanation.human.fix);
    }
  } catch (error) {
    console.error('Pipeline failed:', error);
  } finally {
    await BrowserPool.closeBrowser();
  }
}

main();
