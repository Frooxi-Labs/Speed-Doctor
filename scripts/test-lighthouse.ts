import { runLighthouse } from '../packages/lighthouse-engine/src/index';

async function main() {
  const url = process.argv[2] || 'https://example.com';
  console.log(`Starting Lighthouse audit of ${url}...`);
  try {
    const result = await runLighthouse(url, 'desktop');
    console.log('Lighthouse completed successfully!');
    console.log('Scores:');
    console.log('- Performance:', result.scores.performance);
    console.log('- SEO:', result.scores.seo);
    console.log('- Accessibility:', result.scores.accessibility);
    console.log('- Best Practices:', result.scores.bestPractices);
    console.log('Metrics:');
    console.log('- LCP (ms):', result.metrics.lcp);
    console.log('- CLS:', result.metrics.cls);
    console.log('- INP (ms):', result.metrics.inp);
    console.log('- FCP (ms):', result.metrics.fcp);
    console.log('- TTFB (ms):', result.metrics.ttfb);
    console.log('- Speed Index:', result.metrics.speedIndex);
    console.log('- TBT (ms):', result.metrics.tbt);
    console.log('Opportunities Count:', result.opportunities.length);
    console.log('Diagnostics Count:', result.diagnostics.length);
    if (result.opportunities.length > 0) {
      console.log('First Opportunity:', result.opportunities[0]);
    }
  } catch (error) {
    console.error('Lighthouse run failed:', error);
  }
}

main();
