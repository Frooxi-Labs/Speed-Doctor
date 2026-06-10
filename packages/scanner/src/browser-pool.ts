import { chromium, type Browser } from 'playwright-core';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

export class BrowserPool {
  private static instance: Browser | null = null;
  private static launchPromise: Promise<Browser> | null = null;

  public static async getBrowser(): Promise<Browser> {
    // Return existing connected browser
    if (BrowserPool.instance?.isConnected()) {
      return BrowserPool.instance;
    }

    // If a launch is already in progress, wait for it
    if (BrowserPool.launchPromise) {
      return BrowserPool.launchPromise;
    }

    // Launch a new browser
    BrowserPool.launchPromise = chromium
      .launch({ headless: true, args: LAUNCH_ARGS })
      .then((browser) => {
        BrowserPool.instance = browser;
        BrowserPool.launchPromise = null;

        // Auto-recover on unexpected disconnect
        browser.on('disconnected', () => {
          BrowserPool.instance = null;
          BrowserPool.launchPromise = null;
        });

        return browser;
      })
      .catch((err) => {
        BrowserPool.launchPromise = null;
        throw err;
      });

    return BrowserPool.launchPromise;
  }

  public static async closeBrowser(): Promise<void> {
    const b = BrowserPool.instance;
    BrowserPool.instance = null;
    BrowserPool.launchPromise = null;
    if (b?.isConnected()) {
      await b.close();
    }
  }
}
