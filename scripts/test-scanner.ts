import { scanPage, BrowserPool } from '../packages/scanner/src/index';

async function main() {
  const url = process.argv[2] || 'https://example.com';
  console.log(`Starting scan of ${url}...`);
  try {
    const result = await scanPage(url, 'desktop');
    console.log('Scan completed successfully!');
    console.log('URL:', result.url);
    console.log('Final URL:', result.finalUrl);
    console.log('Assets count:');
    console.log('- Images:', result.assets.images.length);
    console.log('- Scripts:', result.assets.scripts.length);
    console.log('- Styles:', result.assets.styles.length);
    console.log('- Fonts:', result.assets.fonts.length);
    console.log('- Videos:', result.assets.videos.length);
    console.log('- ThirdParty:', result.assets.thirdParty.length);
    console.log('Network Requests:', result.networkRequests.length);
    console.log('Page Timings:', result.timings);
  } catch (error) {
    console.error('Scan failed:', error);
  } finally {
    await BrowserPool.closeBrowser();
  }
}

main();
