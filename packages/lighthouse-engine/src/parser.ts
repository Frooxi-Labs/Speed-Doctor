import { type LighthouseResult, type LighthouseOpportunity, type LighthouseDiagnostic } from '@speed-doctor/shared-types';

export function parseLighthouseResult(lhJson: any): LighthouseResult {
  const categories = lhJson.categories || {};
  const audits = lhJson.audits || {};

  const scores = {
    performance: Math.round((categories.performance?.score ?? 0) * 100),
    seo: Math.round((categories.seo?.score ?? 0) * 100),
    accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
  };

  const metrics = {
    lcp: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
    cls: Number(audits['cumulative-layout-shift']?.numericValue ?? 0),
    inp: Math.round(
      audits['experimental-interaction-to-next-paint']?.numericValue ??
      audits['interaction-to-next-paint']?.numericValue ??
      audits['max-potential-fid']?.numericValue ??
      0
    ),
    fcp: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
    ttfb: Math.round(audits['server-response-time']?.numericValue ?? 0),
    speedIndex: Math.round(audits['speed-index']?.numericValue ?? 0),
    tbt: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
  };

  const opportunities: LighthouseOpportunity[] = [];
  const diagnostics: LighthouseDiagnostic[] = [];

  for (const [id, audit] of Object.entries(audits) as [string, any][]) {
    if (!audit) continue;

    // Opportunities are audits that suggest performance optimizations with potential savings
    if (audit.details && audit.details.type === 'opportunity' && (audit.numericValue ?? 0) > 0) {
      opportunities.push({
        id,
        title: audit.title,
        description: audit.description,
        numericValue: audit.numericValue ?? 0,
        numericUnit: audit.numericUnit ?? 'ms',
        displayValue: audit.displayValue ?? '',
        warnings: audit.warnings,
      });
    } else if (
      audit.score !== null &&
      audit.score < 0.9 &&
      audit.id !== 'largest-contentful-paint' &&
      audit.id !== 'cumulative-layout-shift' &&
      audit.id !== 'first-contentful-paint' &&
      audit.id !== 'server-response-time' &&
      audit.id !== 'total-blocking-time' &&
      audit.id !== 'speed-index'
    ) {
      diagnostics.push({
        id,
        title: audit.title,
        description: audit.description,
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        displayValue: audit.displayValue,
      });
    }
  }

  return {
    scores,
    metrics,
    opportunities,
    diagnostics,
  };
}
