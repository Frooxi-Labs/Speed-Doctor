import { type Page } from 'playwright-core';
import { type PageTimings } from '@speed-doctor/shared-types';

export async function collectPageTimings(page: Page): Promise<PageTimings> {
  try {
    const timings = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      const navTiming = entries[0] as PerformanceNavigationTiming | undefined;
      if (!navTiming) {
        return {};
      }

      return {
        navigationStart: 0,
        ttfb: Math.round(navTiming.responseStart),
        domInteractive: Math.round(navTiming.domInteractive),
        domComplete: Math.round(navTiming.domComplete),
        loadEventEnd: Math.round(navTiming.loadEventEnd),
      };
    });

    return timings;
  } catch (error) {
    // Return empty timings if evaluation fails (e.g. page crashes)
    return {};
  }
}
