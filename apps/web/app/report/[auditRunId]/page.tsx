'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { type AuditReport, type ScanDevice } from '@speed-doctor/shared-types';
import ProgressBar from '../../../components/ProgressBar';
import OverallScoreCard from '../../../components/OverallScoreCard';
import MetricsRow from '../../../components/MetricsRow';
import AudienceToggle from '../../../components/AudienceToggle';
import IssueCard from '../../../components/IssueCard';
import AuditSkeleton from '../../../components/AuditSkeleton';
import DeviceTabs from '../../../components/DeviceTabs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type FetchResult =
  | { status: 'completed'; report: AuditReport }
  | { status: 'pending' | 'running'; }
  | { status: 'failed'; errorMessage: string };

async function fetchOne(id: string): Promise<FetchResult> {
  const res = await fetch(`${API_URL}/api/audit/${id}`);
  if (!res.ok) throw new Error('Failed to retrieve audit report.');
  const data = await res.json();
  if (data.status === 'completed' || data.scores) return { status: 'completed', report: data as AuditReport };
  if (data.status === 'failed') return { status: 'failed', errorMessage: data.errorMessage || 'Audit failed.' };
  return { status: data.status === 'running' ? 'running' : 'pending' };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper">{children}</div>;
}

function ReportInner() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const primaryId = params.auditRunId as string;
  const mobileId = search.get('m');

  const ids = useMemo(() => (mobileId ? [primaryId, mobileId] : [primaryId]), [primaryId, mobileId]);
  const deviceLabels = useMemo<Record<string, string>>(
    () => (mobileId ? { [primaryId]: 'Desktop', [mobileId]: 'Mobile' } : {}),
    [primaryId, mobileId],
  );

  const [phase, setPhase] = useState<'loading' | 'running' | 'completed' | 'failed'>('loading');
  const [reports, setReports] = useState<Partial<Record<ScanDevice, AuditReport>>>({});
  const [activeDevice, setActiveDevice] = useState<ScanDevice>(mobileId ? 'mobile' : 'desktop');
  const [error, setError] = useState<string | null>(null);
  const [audienceMode, setAudienceMode] = useState<'human' | 'developer'>('human');
  const [copied, setCopied] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const results = await Promise.all(ids.map(fetchOne));
      const failed = results.find((r) => r.status === 'failed') as Extract<FetchResult, { status: 'failed' }> | undefined;
      if (failed) {
        setError(failed.errorMessage);
        setPhase('failed');
        return;
      }
      if (results.every((r) => r.status === 'completed')) {
        const next: Partial<Record<ScanDevice, AuditReport>> = {};
        for (const r of results) {
          if (r.status === 'completed') next[r.report.device] = r.report;
        }
        setReports(next);
        setActiveDevice((prev) => (next[prev] ? prev : next.mobile ? 'mobile' : 'desktop'));
        setPhase('completed');
      } else {
        setPhase('running');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the server.');
      setPhase('failed');
    }
  }, [ids]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---------- Loading ----------
  if (phase === 'loading') {
    return (
      <Shell>
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">
          <AuditSkeleton />
        </div>
      </Shell>
    );
  }

  // ---------- Running ----------
  if (phase === 'running') {
    return (
      <Shell>
        <div className="flex min-h-screen flex-col justify-center px-6 py-16">
          <ProgressBar
            auditRunIds={ids}
            deviceLabels={deviceLabels}
            onComplete={loadAll}
            onError={(msg) => {
              setError(msg);
              setPhase('failed');
            }}
          />
        </div>
      </Shell>
    );
  }

  const report = reports[activeDevice];

  // ---------- Failed ----------
  if (phase === 'failed' || !report) {
    return (
      <Shell>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="max-w-md rounded-[28px] border border-ink/10 bg-paper-pure p-10 shadow-editorial">
            <span className="font-mono text-[11px] uppercase tracking-widest text-coral-deep">Diagnosis halted</span>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">We couldn&apos;t finish</h2>
            <p className="mt-4 rounded-2xl border border-coral-deep/20 bg-coral-tint p-4 text-left font-mono text-xs text-coral-deep">
              {error || 'An unexpected error occurred during the audit.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full rounded-2xl bg-ink py-3.5 font-display text-base font-medium text-paper transition-colors hover:bg-coral hover:text-ink"
            >
              Start a new diagnosis
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const available = Object.keys(reports) as ScanDevice[];

  // Asset highlights from the active report
  const assetHighlights = (() => {
    const out: Array<{ url: string; label: string; title: string; description: string; size?: number | undefined; type?: string | undefined }> = [];
    for (const issue of report.issues) {
      const data = issue.data as Record<string, unknown> | undefined;
      const url = typeof data?.url === 'string' ? (data.url as string) : undefined;
      const samples = Array.isArray(data?.sampleUrls) ? (data.sampleUrls as string[]) : [];
      if (issue.ruleId.startsWith('images/') && url) {
        out.push({ url, label: 'Image', title: issue.explanation.human.title, description: issue.explanation.human.explanation, size: typeof data?.size === 'number' ? (data.size as number) : undefined, type: typeof data?.type === 'string' ? (data.type as string) : undefined });
      }
      if (issue.ruleId === 'js/render-blocking' && samples.length) {
        samples.slice(0, 3).forEach((u) => out.push({ url: u, label: 'Script', title: issue.explanation.human.title, description: 'Render-blocking external script' }));
      }
      if (issue.ruleId.startsWith('videos/') && url) {
        out.push({ url, label: 'Video', title: issue.explanation.human.title, description: issue.explanation.human.explanation });
      }
    }
    return Array.from(new Map(out.map((i) => [i.url, i])).values()).slice(0, 4);
  })();

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'assets', label: 'Assets' },
    { id: 'issues', label: 'Issues' },
  ];

  return (
    <Shell>
      {/* ---------- Header bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-10">
          <button onClick={() => router.push('/')} className="font-display text-lg font-semibold tracking-tightest text-ink">
            Speed<span className="text-coral-deep">·</span>Doctor
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              New scan
            </button>
            <button
              onClick={copyShareLink}
              className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-coral-deep hover:text-paper"
            >
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:px-10">
        {/* Title + device tabs */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-lg italic text-ink/60">Diagnostic report</p>
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-display text-3xl font-medium tracking-tight text-ink hover:text-coral-deep md:text-4xl"
              >
                {report.url.replace(/^https?:\/\//, '')}
              </a>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                Scanned {new Date(report.scannedAt).toLocaleString()}
              </p>
            </div>
            <DeviceTabs active={activeDevice} available={available} onChange={setActiveDevice} />
          </div>

          {/* Section anchors */}
          <nav className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-ink/12 px-4 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        {/* ---------- Overview ---------- */}
        <section id="overview" className="scroll-mt-24 space-y-6">
          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <OverallScoreCard score={report.scores.performance} title="Performance" primary />
            <OverallScoreCard score={report.scores.accessibility} title="Accessibility" />
            <OverallScoreCard score={report.scores.bestPractices} title="Best Practices" />
            <OverallScoreCard score={report.scores.seo} title="SEO" />
          </div>

          <MetricsRow metrics={report.metrics} />

          {/* Summary strip */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
            {[
              { label: 'Total issues', value: report.summary.totalIssues, color: '#16273b' },
              { label: 'Critical', value: report.summary.criticalCount, color: '#D9655E' },
              { label: 'High', value: report.summary.highCount, color: '#D79A3C' },
              { label: 'Potential gain', value: `~${(report.summary.estimatedGain / 1000).toFixed(1)}s`, color: '#5E97A6' },
            ].map((stat) => (
              <div key={stat.label} className="bg-paper-pure p-5 text-center">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">{stat.label}</span>
                <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Assets ---------- */}
        <section id="assets" className="scroll-mt-24 space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">Heaviest assets</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Root causes</span>
          </div>
          {assetHighlights.length === 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-paper-pure p-6 text-sm text-ink-soft">
              No direct asset previews for this report. The issues below still pinpoint the causes and fixes.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assetHighlights.map((asset) => (
                <div key={asset.url} className="rounded-3xl border border-ink/10 bg-paper-pure p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">{asset.label}</span>
                    {asset.size !== undefined && (
                      <span className="text-xs font-semibold text-coral-deep">{Math.round(asset.size / 1024)} KB</span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-lg font-medium tracking-tight text-ink">{asset.title}</p>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-sm text-sky-deep hover:underline">
                    {asset.url}
                  </a>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">{asset.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- Issues ---------- */}
        <section id="issues" className="scroll-mt-24 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">Issues &amp; fixes</h2>
              <p className="mt-1 text-sm text-ink-soft">Ranked by impact on this device&apos;s performance.</p>
            </div>
            <AudienceToggle mode={audienceMode} onChange={setAudienceMode} />
          </div>

          {report.issues.length === 0 ? (
            <div className="rounded-3xl border border-good/25 bg-good/[0.07] p-12 text-center">
              <h3 className="font-display text-2xl font-medium text-ink">A clean bill of health</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                This page passed every DOM analyzer check. Keep those loading habits sharp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.issues.map((issue, idx) => (
                <IssueCard key={`${issue.ruleId}-${idx}`} issue={issue} mode={audienceMode} index={idx} />
              ))}
            </div>
          )}
        </section>
      </main>
    </Shell>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<Shell><div className="mx-auto max-w-5xl px-6 py-16 md:px-10"><AuditSkeleton /></div></Shell>}>
      <ReportInner />
    </Suspense>
  );
}
