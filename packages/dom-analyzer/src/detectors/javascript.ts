import { type AssetInfo, type RawIssue } from '@speed-doctor/shared-types';
import { parseHtmlTags } from '../utils';

export function detectJavascriptIssues(scripts: AssetInfo[], html: string): RawIssue[] {
  const issues: RawIssue[] = [];

  // 1. Oversized bundles
  for (const js of scripts) {
    if (js.size > 500_000) {
      issues.push({
        ruleId: 'js/oversized-bundle',
        category: 'performance',
        severity: 'high',
        element: js.url,
        data: { url: js.url, size: js.size },
        estimatedImpactScore: 25,
      });
    }
  }

  // 2. Too many scripts
  if (scripts.length > 20) {
    issues.push({
      ruleId: 'js/too-many-scripts',
      category: 'performance',
      severity: 'medium',
      data: { count: scripts.length },
      estimatedImpactScore: 15,
    });
  }

  // 3. Render blocking scripts
  const scriptTags = parseHtmlTags(html, 'script');
  let renderBlockingCount = 0;
  const sampleUrls: string[] = [];

  for (const tag of scriptTags) {
    const src = tag.attrs['src'] || '';
    const hasAsync = 'async' in tag.attrs;
    const hasDefer = 'defer' in tag.attrs;
    const type = tag.attrs['type'] || '';

    // Only external scripts with src can block HTML parsing/rendering
    if (src && !hasAsync && !hasDefer && type !== 'module' && type !== 'application/json') {
      renderBlockingCount++;
      if (sampleUrls.length < 5) {
        sampleUrls.push(src);
      }
    }
  }

  if (renderBlockingCount > 0) {
    issues.push({
      ruleId: 'js/render-blocking',
      category: 'performance',
      severity: 'high',
      data: { count: renderBlockingCount, sampleUrls },
      estimatedImpactScore: 20,
    });
  }

  return issues;
}
