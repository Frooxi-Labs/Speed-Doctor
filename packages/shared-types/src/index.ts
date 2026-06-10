export type ScanDevice = 'desktop' | 'mobile';

export interface AuditJobPayload {
  auditRunId: string;
  websiteId: string;
  url: string;
  device: ScanDevice | 'both';
  triggeredBy: 'user' | 'schedule';
  requestedAt?: string;
}

export interface AuditJobProgress {
  stage: 'scanning' | 'lighthouse' | 'dom' | 'ai' | 'saving';
  percent: number;
  message: string;
}

export interface AssetInfo {
  url: string;
  size: number; // in bytes
  type: string; // mime type / resource type
  transferSize?: number;
  timing?: number; // load time ms
}

export interface NetworkRequest {
  url: string;
  resourceType: string;
  method: string;
  status?: number;
  transferSize?: number;
}

export interface PageTimings {
  navigationStart?: number;
  ttfb?: number;
  domInteractive?: number;
  domComplete?: number;
  loadEventEnd?: number;
}

export interface ScanResult {
  url: string;
  finalUrl: string;
  device: ScanDevice;
  html: string;
  assets: {
    images: AssetInfo[];
    scripts: AssetInfo[];
    styles: AssetInfo[];
    fonts: AssetInfo[];
    videos: AssetInfo[];
    thirdParty: AssetInfo[];
  };
  networkRequests: NetworkRequest[];
  timings: PageTimings;
  domSnapshot: string;
  scannedAt: string;
}

export interface LighthouseOpportunity {
  id: string;
  title: string;
  description: string;
  numericValue: number; // time savings in ms
  numericUnit: string;
  displayValue: string;
  warnings?: any[];
}

export interface LighthouseDiagnostic {
  id: string;
  title: string;
  description: string;
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
}

export interface LighthouseResult {
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  metrics: {
    lcp: number;
    cls: number;
    inp: number;
    fcp: number;
    ttfb: number;
    speedIndex: number;
    tbt: number;
  };
  opportunities: LighthouseOpportunity[];
  diagnostics: LighthouseDiagnostic[];
}

export interface RawIssue {
  ruleId: string;
  category: 'performance' | 'seo' | 'ux';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element?: string;
  data: Record<string, unknown>;
  estimatedImpactScore: number;
}

export interface CorrelatedIssue extends RawIssue {
  affectedMetrics: ('lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb' | 'tbt')[];
  isRootCause: boolean;
  rank: number;
  estimatedGainMs?: number;
}

export interface AIExplanation {
  human: {
    title: string;
    explanation: string;
    businessImpact: string;
    fix: string;
  };
  developer: {
    title: string;
    rootCause: string;
    technicalImpact: string;
    codeExample: string;
    references: string[];
  };
}

export interface PrioritizedIssue extends CorrelatedIssue {
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
  explanation: AIExplanation;
}

export interface AuditReport {
  auditRunId: string;
  url: string;
  device: ScanDevice;
  scannedAt: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  metrics: {
    lcp: number;
    cls: number;
    inp: number;
    fcp: number;
    ttfb: number;
    speedIndex: number;
    tbt: number;
  };
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    estimatedGain: number;
  };
  issues: PrioritizedIssue[];
  shareableLink: string;
}
