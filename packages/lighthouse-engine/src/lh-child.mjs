// Standalone Lighthouse runner — executed in its own child process so that
// Lighthouse's process-global `perf_hooks` timing marks (e.g. lh:runner:gather)
// can never collide with another audit, a second lighthouse-logger copy, or the
// rest of the worker pipeline. Pure JS on purpose: it runs identically under
// tsx (dev) and node (prod) with no compile step.
//
// Input:  a JSON payload as argv[2] -> { url, device }
// Output: the raw Lighthouse report (LHR) JSON written to stdout.

import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

async function main() {
  let payload;
  try {
    payload = JSON.parse(process.argv[2] ?? '{}');
  } catch {
    throw new Error('Invalid payload passed to lighthouse child process.');
  }

  const { url, device } = payload;
  if (!url) throw new Error('No URL provided to lighthouse child process.');

  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    port: chrome.port,
    formFactor: device === 'mobile' ? 'mobile' : 'desktop',
    screenEmulation:
      device === 'mobile'
        ? { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'simulate',
  };

  try {
    const result = await lighthouse(url, options);
    if (!result) throw new Error('Lighthouse audit failed to yield any results.');
    const reportJson =
      typeof result.report === 'string' ? result.report : JSON.stringify(result.lhr);
    process.stdout.write(reportJson);
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  process.stderr.write(String(err?.stack ?? err?.message ?? err));
  process.exit(1);
});
