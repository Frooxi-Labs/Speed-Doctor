import { chromium } from 'playwright-core';

console.log('Testing Playwright launching...');

async function test() {
  console.log('1. Launching chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  console.log('2. Chromium launched successfully! Creating context...');
  
  const context = await browser.newContext();
  console.log('3. Context created. Creating page...');
  
  const page = await context.newPage();
  console.log('4. Page created. Navigating to https://example.com...');
  
  await page.goto('https://example.com', {
    waitUntil: 'load',
    timeout: 10000,
  });
  console.log('5. Navigation completed! Page title:', await page.title());
  
  await browser.close();
  console.log('6. Browser closed successfully!');
}

test().catch((err) => {
  console.error('Playwright test failed:', err);
});
