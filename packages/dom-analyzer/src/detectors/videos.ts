import { type AssetInfo, type RawIssue } from '@speed-doctor/shared-types';
import { parseHtmlTags } from '../utils';

export function detectVideoIssues(videos: AssetInfo[], html: string): RawIssue[] {
  const issues: RawIssue[] = [];

  // Parse HTML <video> tags to find autoplay/preload issues
  const videoTags = parseHtmlTags(html, 'video');
  const sourceTags = parseHtmlTags(html, 'source');

  const videoUrls = new Set<string>();
  for (const asset of videos) {
    if (asset.url) videoUrls.add(asset.url);
  }
  for (const tag of videoTags) {
    const src = tag.attrs['src'] || tag.attrs['data-src'] || '';
    if (src) videoUrls.add(src);
  }
  for (const tag of sourceTags) {
    const src = tag.attrs['src'] || tag.attrs['data-src'] || '';
    if (src) videoUrls.add(src);
  }

  const sampleVideoUrls = Array.from(videoUrls).slice(0, 5);
  const firstVideoUrl = sampleVideoUrls[0];

  let autoplayNoMutedCount = 0;
  let preloadBloatCount = 0;

  for (const tag of videoTags) {
    const hasAutoplay = 'autoplay' in tag.attrs || tag.attrs['autoplay'] === '';
    const hasMuted = 'muted' in tag.attrs || tag.attrs['muted'] === '';
    const preload = tag.attrs['preload'];

    if (hasAutoplay && !hasMuted) {
      autoplayNoMutedCount++;
    }

    // preload="auto" forces full video download before play; flag it.
    // Missing preload is browser-decided (usually metadata), not flagged here.
    if (preload === 'auto') {
      preloadBloatCount++;
    }
  }

  if (autoplayNoMutedCount > 0) {
    issues.push({
      ruleId: 'videos/no-mute-autoplay',
      category: 'ux',
      severity: 'high',
      data: {
        count: autoplayNoMutedCount,
        url: firstVideoUrl,
        sampleUrls: sampleVideoUrls,
      },
      estimatedImpactScore: 20,
    });
  }

  if (preloadBloatCount > 0) {
    issues.push({
      ruleId: 'videos/preload-bloat',
      category: 'performance',
      severity: 'medium',
      data: {
        count: preloadBloatCount,
        url: firstVideoUrl,
        sampleUrls: sampleVideoUrls,
      },
      estimatedImpactScore: 12,
    });
  }

  if (videos.length > 3) {
    issues.push({
      ruleId: 'videos/too-many',
      category: 'performance',
      severity: 'medium',
      data: {
        count: videos.length,
        url: firstVideoUrl,
        sampleUrls: sampleVideoUrls,
      },
      estimatedImpactScore: 15,
    });
  }

  return issues;
}
