import { type Browser, type Page } from 'playwright-core';
import { type ScanDevice } from '@speed-doctor/shared-types';

export const USER_AGENTS = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SpeedDoctor/1.0',
  mobile: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 SpeedDoctor/1.0',
};

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

export async function withIsolatedPage<T>(
  browser: Browser,
  device: ScanDevice,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const context = await browser.newContext({
    userAgent: USER_AGENTS[device],
    viewport: VIEWPORTS[device],
    isMobile: device === 'mobile',
    hasTouch: device === 'mobile',
    deviceScaleFactor: device === 'mobile' ? 2 : 1,
  });

  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await page.close();
    await context.close();
  }
}
