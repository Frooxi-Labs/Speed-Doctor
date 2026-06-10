import { type AssetInfo, type RawIssue } from '@speed-doctor/shared-types';

export function detectFontIssues(fonts: AssetInfo[]): RawIssue[] {
  const issues: RawIssue[] = [];

  // 1. Too many font files
  if (fonts.length > 4) {
    issues.push({
      ruleId: 'fonts/too-many-families',
      category: 'performance',
      severity: 'medium',
      data: { count: fonts.length },
      estimatedImpactScore: 12,
    });
  }

  // 2. Unoptimized formats or oversized fonts
  for (const font of fonts) {
    const isUnoptimized = 
      font.url.toLowerCase().includes('.ttf') || 
      font.url.toLowerCase().includes('.otf') ||
      font.type.includes('ttf') || 
      font.type.includes('opentype');
      
    if (isUnoptimized && font.size > 100_000) {
      issues.push({
        ruleId: 'fonts/unoptimized-format',
        category: 'performance',
        severity: 'low',
        element: font.url,
        data: { url: font.url, size: font.size },
        estimatedImpactScore: 8,
      });
    }

    if (font.size > 150_000) {
      issues.push({
        ruleId: 'fonts/oversized-font',
        category: 'performance',
        severity: 'medium',
        element: font.url,
        data: { url: font.url, size: font.size },
        estimatedImpactScore: 10,
      });
    }
  }

  return issues;
}
