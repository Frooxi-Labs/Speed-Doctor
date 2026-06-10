import { type ScanDevice, type ScanResult } from '@speed-doctor/shared-types';
import { BrowserPool } from './browser-pool';
import { withIsolatedPage } from './page-scanner';
import { validateScanUrl, isSafeNavigationUrl } from './utils/url-validator';
import { NetworkRecorder } from './network-recorder';
import { AssetCollector } from './asset-collector';
import { collectPageTimings } from './timing-collector';

export async function scanPage(rawUrl: string, device: ScanDevice): Promise<ScanResult> {
  const urlObj = await validateScanUrl(rawUrl);
  const validatedUrl = urlObj.toString();

  const browser = await BrowserPool.getBrowser();

  return withIsolatedPage(browser, device, async (page) => {
    const networkRecorder = new NetworkRecorder(page);
    const assetCollector = new AssetCollector(validatedUrl);

    // SSRF guard: re-validate every top-level navigation at request time so a
    // public URL cannot redirect (or DNS-rebind) into a private/internal host
    // between the initial check and the actual fetch.
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && !(await isSafeNavigationUrl(request.url()))) {
        await route.abort('addressunreachable').catch(() => {});
        return;
      }
      await route.continue().catch(() => {});
    });

    // Attach response listener for the asset collector
    page.on('response', (response) => {
      assetCollector.recordResponse(response).catch(() => {});
    });

    // Navigate to the target page
    try {
      await page.goto(validatedUrl, {
        waitUntil: 'load',
        timeout: 45000,
      });
    } catch (e: any) {
      if (e.name === 'TimeoutError') {
        // eslint-disable-next-line no-console
        console.warn(`[Scanner] Timeout waiting for 'load' on ${validatedUrl}, proceeding anyway...`);
      } else {
        throw e;
      }
    }

    // Wait short time to capture lazy resources, up to 5s max
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Ignore networkidle timeout
    }

    const finalUrl = page.url();
    const html = await page.content();
    const timings = await collectPageTimings(page);
    const networkRequests = networkRecorder.getRequests();
    const assets = assetCollector.getAssets();

    return {
      url: validatedUrl,
      finalUrl,
      device,
      html,
      assets,
      networkRequests,
      timings,
      domSnapshot: html, // serialized DOM is page html for MVP
      scannedAt: new Date().toISOString(),
    };
  });
}
