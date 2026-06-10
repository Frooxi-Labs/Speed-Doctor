import { type AssetInfo, type RawIssue } from '@speed-doctor/shared-types';
import { parseHtmlTags } from '../utils';

export function detectImageIssues(images: AssetInfo[], html: string): RawIssue[] {
  const issues: RawIssue[] = [];

  // 1. Oversized images
  for (const img of images) {
    if (img.size > 3_000_000) {
      issues.push({
        ruleId: 'images/oversized',
        category: 'performance',
        severity: 'critical',
        element: img.url,
        data: { size: img.size, url: img.url },
        estimatedImpactScore: 40,
      });
    } else if (img.size > 1_000_000) {
      issues.push({
        ruleId: 'images/oversized',
        category: 'performance',
        severity: 'high',
        element: img.url,
        data: { size: img.size, url: img.url },
        estimatedImpactScore: 25,
      });
    }
  }

  // 2. Unoptimized formats (PNG/JPEG > 250KB)
  for (const img of images) {
    const isPng = img.url.toLowerCase().includes('.png') || img.type.includes('png');
    const isJpeg = img.url.toLowerCase().includes('.jpg') || img.url.toLowerCase().includes('.jpeg') || img.type.includes('jpeg');
    if ((isPng || isJpeg) && img.size > 250_000) {
      issues.push({
        ruleId: 'images/unoptimized-format',
        category: 'performance',
        severity: 'medium',
        element: img.url,
        data: { size: img.size, url: img.url, type: img.type },
        estimatedImpactScore: 15,
      });
    }
  }

  // 3. Missing lazy loading
  const parsedImgTags = parseHtmlTags(html, 'img');
  let missingLazyCount = 0;
  const sampleUrls: string[] = [];

  for (const tag of parsedImgTags) {
    const loading = tag.attrs['loading'];
    if (loading !== 'lazy') {
      missingLazyCount++;
      const src = tag.attrs['src'] || tag.attrs['data-src'] || '';
      if (src && sampleUrls.length < 5) {
        sampleUrls.push(src);
      }
    }
  }

  if (missingLazyCount > 0) {
    issues.push({
      ruleId: 'images/no-lazy-load',
      category: 'performance',
      severity: 'low',
      data: { count: missingLazyCount, sampleUrls },
      estimatedImpactScore: 10,
    });
  }

  return issues;
}
