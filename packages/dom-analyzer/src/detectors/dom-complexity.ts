import { type RawIssue } from '@speed-doctor/shared-types';
import { analyzeDomTree } from '../utils';

export function detectDomComplexityIssues(html: string): RawIssue[] {
  const issues: RawIssue[] = [];
  const { totalElements, maxDepth } = analyzeDomTree(html);

  // 1. Too many elements
  if (totalElements > 1500) {
    issues.push({
      ruleId: 'dom/too-many-elements',
      category: 'performance',
      severity: 'high',
      data: { totalElements },
      estimatedImpactScore: 20,
    });
  } else if (totalElements > 800) {
    issues.push({
      ruleId: 'dom/too-many-elements',
      category: 'performance',
      severity: 'medium',
      data: { totalElements },
      estimatedImpactScore: 10,
    });
  }

  // 2. Deep nesting
  if (maxDepth > 64) {
    issues.push({
      ruleId: 'dom/deep-nesting',
      category: 'performance',
      severity: 'high',
      data: { maxDepth },
      estimatedImpactScore: 18,
    });
  } else if (maxDepth > 32) {
    issues.push({
      ruleId: 'dom/deep-nesting',
      category: 'performance',
      severity: 'medium',
      data: { maxDepth },
      estimatedImpactScore: 8,
    });
  }

  return issues;
}
