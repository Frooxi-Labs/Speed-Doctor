import React, { useState } from 'react';
import { type PrioritizedIssue } from '@speed-doctor/shared-types';

interface IssueCardProps {
  issue: PrioritizedIssue;
  mode: 'human' | 'developer';
  index: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSeconds(ms: number) {
  const s = ms / 1000;
  return s >= 1 ? `${s.toFixed(1)}s` : `${s.toFixed(2)}s`;
}

type SeverityStyle = { color: string; tint: string; label: string };

function severityStyle(priority: string): SeverityStyle {
  switch (priority) {
    case 'critical': return { color: '#D9655E', tint: 'rgba(217,101,94,0.10)', label: 'Critical' };
    case 'high': return { color: '#D79A3C', tint: 'rgba(215,154,60,0.10)', label: 'High' };
    case 'medium': return { color: '#5E97A6', tint: 'rgba(94,151,166,0.12)', label: 'Medium' };
    default: return { color: '#8A97A5', tint: 'rgba(138,151,165,0.10)', label: 'Low' };
  }
}

function AssetBlock({
  assetUrl,
  sampleUrls,
  assetSize,
  assetType,
  showType,
}: {
  assetUrl?: string | undefined;
  sampleUrls: string[];
  assetSize?: number | undefined;
  assetType?: string | undefined;
  showType?: boolean;
}) {
  const isImage = assetUrl ? /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(assetUrl) : false;
  const isVideo = assetUrl ? /\.(mp4|webm|ogg|mov|m4v)$/i.test(assetUrl) : false;
  // Sample URLs can repeat — dedupe so React keys stay unique.
  const uniqueSamples = Array.from(new Set(sampleUrls));
  if (!assetUrl && uniqueSamples.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper-warm p-4">
      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Affected asset</span>
      {assetUrl && (
        <div className="mt-3 space-y-2">
          {isVideo ? (
            <video controls className="w-full max-w-xs rounded-xl border border-ink/10 bg-ink/5">
              <source src={assetUrl} />
            </video>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl} alt="Flagged asset preview" className="w-full max-w-xs rounded-xl border border-ink/10 object-contain" />
          ) : null}
          <a href={assetUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-sky-deep hover:underline">
            {assetUrl}
          </a>
          <div className="flex gap-4 text-xs text-ink-faint">
            {assetSize !== undefined && <span>Size {formatBytes(assetSize)}</span>}
            {showType && assetType && <span>Type {assetType}</span>}
          </div>
        </div>
      )}
      {uniqueSamples.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-ink-faint">Other examples</span>
          <div className="grid gap-1.5">
            {uniqueSamples.slice(0, 3).map((url, i) => (
              <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-ink-soft hover:text-sky-deep hover:underline">
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssueCard({ issue, mode, index }: IssueCardProps) {
  const [copied, setCopied] = useState(false);
  const issueData = issue.data as Record<string, unknown> | undefined;
  const assetUrl = typeof issueData?.url === 'string' ? (issueData.url as string) : undefined;
  const sampleUrls = Array.isArray(issueData?.sampleUrls) ? (issueData.sampleUrls as string[]) : [];
  const assetSize = typeof issueData?.size === 'number' ? (issueData.size as number) : undefined;
  const assetType = typeof issueData?.type === 'string' ? (issueData.type as string) : undefined;

  const sev = severityStyle(issue.priority);

  const copyCode = () => {
    if (issue.explanation.developer.codeExample) {
      navigator.clipboard.writeText(issue.explanation.developer.codeExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-ink/10 bg-paper-pure shadow-card">
      {/* Accent spine + header */}
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: sev.color }} />
        <div className="flex-1 p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-light text-ink-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  {issue.isRootCause && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-paper">
                      Root cause
                    </span>
                  )}
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                    {issue.category} · {issue.ruleId}
                  </span>
                </div>
                <h3 className="mt-1.5 font-display text-xl font-medium tracking-tight text-ink">
                  {mode === 'human'
                    ? issue.explanation.human.title || issue.ruleId
                    : issue.explanation.developer.title || issue.explanation.human.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {issue.estimatedGainMs ? (
                <span className="rounded-full border border-sky-deep/30 bg-sky-tint px-2.5 py-1 text-[11px] font-bold text-sky-deep">
                  slows page ~{formatSeconds(issue.estimatedGainMs)}
                </span>
              ) : null}
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: sev.color, backgroundColor: sev.tint }}
              >
                {sev.label}
              </span>
            </div>
          </div>

          {/* Body */}
          {mode === 'human' ? (
            <div className="mt-5 space-y-5">
              <p className="text-[15px] leading-relaxed text-ink-soft">{issue.explanation.human.explanation}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-paper-warm p-4">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Business impact</span>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{issue.explanation.human.businessImpact}</p>
                </div>
                <div className="rounded-2xl border border-good/25 bg-good/[0.07] p-4">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-good">The fix</span>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{issue.explanation.human.fix}</p>
                </div>
              </div>

              <AssetBlock assetUrl={assetUrl} sampleUrls={sampleUrls} assetSize={assetSize} />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <p className="text-[15px] leading-relaxed text-ink-soft">{issue.explanation.developer.rootCause}</p>

              {issue.element && (
                <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-ink p-3.5 font-mono text-xs text-coral-soft">
                  <span className="mr-2 select-none text-paper/40">target</span>
                  {issue.element}
                </div>
              )}

              <AssetBlock assetUrl={assetUrl} sampleUrls={sampleUrls} assetSize={assetSize} assetType={assetType} showType />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Impacted metrics</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {issue.affectedMetrics.map((m) => (
                      <span key={m} className="rounded-md border border-ink/15 bg-paper-warm px-2 py-0.5 text-[11px] font-bold text-ink">
                        {m.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Technical impact</span>
                  <p className="mt-2 text-sm text-ink-soft">{issue.explanation.developer.technicalImpact}</p>
                </div>
              </div>

              {issue.explanation.developer.codeExample && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Recommended fix</span>
                    <button
                      onClick={copyCode}
                      className="rounded-full border border-ink/15 bg-paper-warm px-3 py-1 text-[11px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded-2xl border border-ink/10 bg-ink p-4 font-mono text-xs leading-relaxed text-paper/90">
                    <code>{issue.explanation.developer.codeExample}</code>
                  </pre>
                </div>
              )}

              {issue.explanation.developer.references?.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-1">
                  {issue.explanation.developer.references.map((ref, idx) => (
                    <a key={idx} href={ref} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-deep hover:underline">
                      Reference {idx + 1} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
