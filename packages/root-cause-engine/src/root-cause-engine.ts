import { type LighthouseResult, type RawIssue, type CorrelatedIssue } from '@speed-doctor/shared-types';

export function correlateIssues(
  lhResult: LighthouseResult,
  rawIssues: RawIssue[]
): CorrelatedIssue[] {
  const metrics = lhResult.metrics;
  
  // Define performance threshold flags
  const isLcpPoor = metrics.lcp > 2500;
  const isClsPoor = metrics.cls > 0.1;
  const isTbtPoor = metrics.tbt > 200;
  const isFcpPoor = metrics.fcp > 1800;
  const isTtfbPoor = metrics.ttfb > 800;
  const isInpPoor = metrics.inp > 200;

  const correlated: CorrelatedIssue[] = rawIssues.map((issue) => {
    const affectedMetrics: ('lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb' | 'tbt')[] = [];
    let isRootCause = false;
    let estimatedGainMs = 0;

    const category = issue.ruleId.split('/')[0];

    if (category === 'images') {
      if (issue.ruleId === 'images/oversized') {
        affectedMetrics.push('lcp');
        if (isLcpPoor) {
          isRootCause = true;
          // Projected savings: 20% to 50% of LCP depending on severity
          const factor = issue.severity === 'critical' ? 0.4 : 0.2;
          estimatedGainMs = Math.round(metrics.lcp * factor);
        }
      } else if (issue.ruleId === 'images/unoptimized-format') {
        affectedMetrics.push('lcp');
        if (isLcpPoor) {
          estimatedGainMs = Math.round(metrics.lcp * 0.1);
        }
      } else if (issue.ruleId === 'images/no-lazy-load') {
        affectedMetrics.push('lcp', 'fcp');
        if (isLcpPoor) {
          estimatedGainMs = Math.round(metrics.lcp * 0.08);
        }
      }
    } else if (category === 'js') {
      if (issue.ruleId === 'js/render-blocking') {
        affectedMetrics.push('fcp', 'lcp');
        if (isFcpPoor || isLcpPoor) {
          isRootCause = true;
          estimatedGainMs = Math.round(metrics.fcp * 0.3);
        }
      } else if (issue.ruleId === 'js/oversized-bundle') {
        affectedMetrics.push('tbt', 'inp');
        if (isTbtPoor || isInpPoor) {
          isRootCause = true;
          estimatedGainMs = Math.round(metrics.tbt * 0.25);
        }
      } else if (issue.ruleId === 'js/too-many-scripts') {
        affectedMetrics.push('tbt', 'inp');
        if (isTbtPoor) {
          estimatedGainMs = Math.round(metrics.tbt * 0.15);
        }
      }
    } else if (category === 'videos') {
      if (issue.ruleId === 'videos/preload-bloat') {
        affectedMetrics.push('ttfb', 'lcp');
        if (isTtfbPoor) {
          estimatedGainMs = Math.round(metrics.ttfb * 0.2);
        }
      } else if (issue.ruleId === 'videos/too-many') {
        affectedMetrics.push('lcp');
        if (isLcpPoor) {
          estimatedGainMs = Math.round(metrics.lcp * 0.05);
        }
      }
    } else if (category === 'fonts') {
      if (issue.ruleId === 'fonts/oversized-font' || issue.ruleId === 'fonts/unoptimized-format') {
        affectedMetrics.push('fcp', 'lcp');
        if (isFcpPoor) {
          estimatedGainMs = Math.round(metrics.fcp * 0.1);
        }
      } else if (issue.ruleId === 'fonts/too-many-families') {
        affectedMetrics.push('fcp');
        if (isFcpPoor) {
          estimatedGainMs = Math.round(metrics.fcp * 0.05);
        }
      }
    } else if (category === 'third-party') {
      if (issue.ruleId === 'third-party/heavy-third-party') {
        affectedMetrics.push('tbt', 'lcp');
        if (isTbtPoor) {
          isRootCause = true;
          estimatedGainMs = Math.round(metrics.tbt * 0.35);
        }
      } else if (issue.ruleId === 'third-party/too-many-trackers') {
        affectedMetrics.push('tbt', 'inp');
        if (isTbtPoor) {
          estimatedGainMs = Math.round(metrics.tbt * 0.1);
        }
      }
    } else if (category === 'dom') {
      if (issue.ruleId === 'dom/too-many-elements' || issue.ruleId === 'dom/deep-nesting') {
        affectedMetrics.push('cls', 'inp', 'tbt');
        if (isClsPoor || isInpPoor) {
          isRootCause = true;
          estimatedGainMs = Math.round(metrics.tbt * 0.2);
        }
      }
    }

    const item: CorrelatedIssue = {
      ...issue,
      affectedMetrics,
      isRootCause,
      rank: 99, // placeholder, will be ranked later
    };

    if (estimatedGainMs > 0) {
      item.estimatedGainMs = estimatedGainMs;
    }

    return item;
  });

  const groupedMap = new Map<string, { issue: CorrelatedIssue, elements: Set<string> }>();
  for (const item of correlated) {
    const existingEntry = groupedMap.get(item.ruleId);
    if (!existingEntry) {
      groupedMap.set(item.ruleId, { 
        issue: { ...item }, 
        elements: new Set(item.element ? [item.element] : []) 
      });
    } else {
      const existing = existingEntry.issue;
      existing.affectedMetrics = Array.from(new Set([...existing.affectedMetrics, ...item.affectedMetrics]));
      existing.isRootCause = existing.isRootCause || item.isRootCause;
      existing.estimatedImpactScore = Math.max(existing.estimatedImpactScore, item.estimatedImpactScore);
      if (item.estimatedGainMs) {
        existing.estimatedGainMs = (existing.estimatedGainMs || 0) + item.estimatedGainMs;
      }
      if (item.element) {
        existingEntry.elements.add(item.element);
      }
    }
  }

  const grouped = Array.from(groupedMap.values()).map(({ issue, elements }) => {
    const elementsArr = Array.from(elements);
    if (elementsArr.length > 0) {
      if (elementsArr.length <= 3) {
        issue.element = elementsArr.join(', ');
      } else {
        issue.element = `${elementsArr.slice(0, 3).join(', ')} (+ ${elementsArr.length - 3} more)`;
      }
    }
    return issue;
  });

  // Sort: root causes first, then by impact score descending
  const sorted = [...grouped].sort((a, b) => {
    if (a.isRootCause && !b.isRootCause) return -1;
    if (!a.isRootCause && b.isRootCause) return 1;
    return b.estimatedImpactScore - a.estimatedImpactScore;
  });

  // Assign sequential ranks
  return sorted.map((issue, index) => ({
    ...issue,
    rank: index + 1,
  }));
}

