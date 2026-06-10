import { scanPage, BrowserPool } from '../packages/scanner/src/index';
import { analyzeDom } from '../packages/dom-analyzer/src/index';

async function main() {
  const url = process.argv[2] || 'https://example.com';
  console.log(`Starting scan of ${url} to analyze DOM...`);
  try {
    const scanResult = await scanPage(url, 'desktop');
    console.log('Scan completed. Running DOM Analyzer...');
    const issues = analyzeDom(scanResult);
    console.log(`DOM Analysis complete. Found ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.log(`- [${issue.severity.toUpperCase()}] ${issue.ruleId} (Impact: ${issue.estimatedImpactScore})`);
      if (issue.element) {
        console.log(`  Element: ${issue.element}`);
      }
      console.log('  Data:', JSON.stringify(issue.data));
    }
  } catch (error) {
    console.error('DOM analysis run failed:', error);
  } finally {
    await BrowserPool.closeBrowser();
  }
}

main();
