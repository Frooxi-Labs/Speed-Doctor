import {
  type LighthouseResult,
  type CorrelatedIssue,
  type PrioritizedIssue,
  type AuditReport,
  type ScanDevice,
} from '@speed-doctor/shared-types';
import { explainIssue } from '@speed-doctor/ai-engine';

const AI_BATCH_SIZE = Math.max(1, parseInt(process.env.AI_BATCH_SIZE ?? '3', 10));

function getMetricSeverity(metricName: string, value: number): number {
  switch (metricName) {
    case 'lcp':
      if (value > 4000) return 100;
      if (value > 2500) return 50;
      return 0;
    case 'cls':
      if (value > 0.25) return 100;
      if (value > 0.1) return 50;
      return 0;
    case 'inp':
      if (value > 500) return 100;
      if (value > 200) return 50;
      return 0;
    case 'fcp':
      if (value > 3000) return 100;
      if (value > 1800) return 50;
      return 0;
    case 'ttfb':
      if (value > 1800) return 100;
      if (value > 800) return 50;
      return 0;
    case 'tbt':
      if (value > 600) return 100;
      if (value > 200) return 50;
      return 0;
    default:
      return 0;
  }
}

async function processInBatches<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function generateReport(
  auditRunId: string,
  url: string,
  device: ScanDevice,
  lhResult: LighthouseResult,
  correlatedIssues: CorrelatedIssue[],
): Promise<AuditReport> {
  const metrics = lhResult.metrics;

  const prioritizeIssue = async (issue: CorrelatedIssue): Promise<PrioritizedIssue> => {
    let maxMetricSeverity = 0;
    for (const m of issue.affectedMetrics) {
      const val = metrics[m];
      if (val !== undefined) {
        const sev = getMetricSeverity(m, val);
        if (sev > maxMetricSeverity) maxMetricSeverity = sev;
      }
    }

    // Root-cause issues get a 15-point priority boost so they surface above
    // non-root-cause issues with similar impact scores.
    const rootCauseBonus = issue.isRootCause ? 15 : 0;
    const priorityScore = Math.min(
      100,
      Math.round(issue.estimatedImpactScore * 0.6 + maxMetricSeverity * 0.4 + rootCauseBonus),
    );

    let priority: PrioritizedIssue['priority'] = 'low';
    if (priorityScore >= 80) priority = 'critical';
    else if (priorityScore >= 50) priority = 'high';
    else if (priorityScore >= 25) priority = 'medium';

    const explanation = await explainIssue(issue);

    return { ...issue, priority, priorityScore, explanation };
  };

  const issues = await processInBatches(correlatedIssues, AI_BATCH_SIZE, prioritizeIssue);

  issues.sort((a, b) => b.priorityScore - a.priorityScore);
  issues.forEach((issue, index) => { issue.rank = index + 1; });

  const totalIssues = issues.length;
  const criticalCount = issues.filter((i) => i.priority === 'critical').length;
  const highCount = issues.filter((i) => i.priority === 'high').length;
  const estimatedGain = issues.reduce((acc, curr) => acc + (curr.estimatedGainMs ?? 0), 0);

  return {
    auditRunId,
    url,
    device,
    scannedAt: new Date().toISOString(),
    scores: lhResult.scores,
    metrics: lhResult.metrics,
    summary: { totalIssues, criticalCount, highCount, estimatedGain },
    issues,
    shareableLink: `/report/${auditRunId}`,
  };
}
