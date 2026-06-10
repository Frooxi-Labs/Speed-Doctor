import { type AssetInfo, type RawIssue } from '@speed-doctor/shared-types';

export function detectThirdPartyIssues(thirdParty: AssetInfo[], allAssets: AssetInfo[]): RawIssue[] {
  const issues: RawIssue[] = [];

  const hosts = new Set<string>();
  let thirdPartySize = 0;
  for (const asset of thirdParty) {
    try {
      const u = new URL(asset.url);
      hosts.add(u.hostname);
    } catch {}
    thirdPartySize += asset.transferSize || asset.size;
  }

  // 1. Too many external domains
  if (hosts.size > 10) {
    issues.push({
      ruleId: 'third-party/too-many-trackers',
      category: 'performance',
      severity: 'medium',
      data: { domainsCount: hosts.size, domains: Array.from(hosts) },
      estimatedImpactScore: 12,
    });
  }

  // 2. Heavy third party ratio
  let totalSize = 0;
  for (const asset of allAssets) {
    totalSize += asset.transferSize || asset.size;
  }

  if (totalSize > 0) {
    const ratio = thirdPartySize / totalSize;
    if (ratio > 0.5 && thirdPartySize > 500_000) {
      issues.push({
        ruleId: 'third-party/heavy-third-party',
        category: 'performance',
        severity: 'high',
        data: { ratio: Math.round(ratio * 100), thirdPartySize, totalSize },
        estimatedImpactScore: 18,
      });
    }
  }

  return issues;
}
