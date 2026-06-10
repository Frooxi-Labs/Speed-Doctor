import { type Response } from 'playwright-core';
import { type AssetInfo } from '@speed-doctor/shared-types';

export class AssetCollector {
  private assets: {
    images: AssetInfo[];
    scripts: AssetInfo[];
    styles: AssetInfo[];
    fonts: AssetInfo[];
    videos: AssetInfo[];
    thirdParty: AssetInfo[];
  } = {
    images: [],
    scripts: [],
    styles: [],
    fonts: [],
    videos: [],
    thirdParty: [],
  };

  private targetHost: string;

  constructor(targetUrl: string) {
    try {
      this.targetHost = new URL(targetUrl).hostname;
    } catch {
      this.targetHost = '';
    }
  }

  public async recordResponse(response: Response): Promise<void> {
    const urlStr = response.url();
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      return;
    }

    const request = response.request();
    const resourceType = request.resourceType();
    const contentType = response.headers()['content-type'] || '';
    
    let size = 0;
    let transferSize = 0;
    try {
      const sizes = await (response as any).sizes();
      size = sizes.responseBodySize || 0;
      transferSize = (sizes.responseBodySize || 0) + (sizes.responseHeadersSize || 0);
    } catch {
      size = Number(response.headers()['content-length'] ?? 0);
      transferSize = size;
    }

    const asset: AssetInfo = {
      url: urlStr,
      size,
      type: contentType,
      transferSize,
    };

    // Categorize
    const isExternal = url.hostname !== this.targetHost;
    if (isExternal) {
      this.assets.thirdParty.push(asset);
    }

    // Check by resourceType first, then fallback to mime/extension
    if (resourceType === 'image' || contentType.startsWith('image/')) {
      this.assets.images.push(asset);
    } else if (resourceType === 'script' || contentType.includes('javascript') || contentType.includes('ecmascript')) {
      this.assets.scripts.push(asset);
    } else if (resourceType === 'stylesheet' || contentType.includes('css')) {
      this.assets.styles.push(asset);
    } else if (resourceType === 'font' || contentType.includes('font') || /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(urlStr)) {
      this.assets.fonts.push(asset);
    } else if (resourceType === 'media' || contentType.startsWith('video/') || contentType.startsWith('audio/') || /\.(mp4|webm|ogg|mp3|wav)(\?.*)?$/i.test(urlStr)) {
      this.assets.videos.push(asset);
    }
  }

  public getAssets() {
    return this.assets;
  }
}
