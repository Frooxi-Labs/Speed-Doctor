'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

interface ProgressState {
  stage: string;
  percent: number;
  message: string;
}

interface ProgressBarProps {
  auditRunIds: string[];
  deviceLabels?: Record<string, string>;
  onComplete: () => void;
  onError: (errorMsg: string) => void;
}

const STAGES = [
  { key: 'scanning', label: 'Scan', desc: 'Capturing the page with a real browser' },
  { key: 'lighthouse', label: 'Measure', desc: 'Running Lighthouse for Core Web Vitals' },
  { key: 'dom', label: 'Analyse', desc: 'Inspecting assets, scripts and DOM weight' },
  { key: 'ai', label: 'Diagnose', desc: 'Generating root-cause explanations' },
  { key: 'saving', label: 'Compile', desc: 'Assembling your report' },
];

export default function ProgressBar({ auditRunIds, deviceLabels, onComplete, onError }: ProgressBarProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const [states, setStates] = useState<Record<string, ProgressState>>(() =>
    Object.fromEntries(auditRunIds.map((id) => [id, { stage: 'scanning', percent: 5, message: 'Connecting…' }])),
  );
  const completedRef = useRef(false);
  const idsKey = auditRunIds.join(',');

  useEffect(() => {
    completedRef.current = false;
    const sources = auditRunIds.map((id) => {
      const es = new EventSource(`${apiUrl}/api/audit/${id}/status`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ProgressState;
          setStates((prev) => ({ ...prev, [id]: data }));
          if (data.stage === 'failed') {
            onError(data.message || 'Audit failed.');
            es.close();
          }
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => { /* EventSource auto-retries on transient blips */ };
      return es;
    });

    return () => sources.forEach((es) => es.close());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, apiUrl]);

  const aggregatePercent = useMemo(() => {
    const values = auditRunIds.map((id) => states[id]?.percent ?? 0);
    return values.length ? Math.min(...values) : 0;
  }, [states, auditRunIds]);

  // Drive the stepper from the slowest run
  const slowestId = useMemo<string>(() => {
    if (auditRunIds.length === 0) return '';
    return auditRunIds.reduce(
      (slow, id) => ((states[id]?.percent ?? 0) < (states[slow]?.percent ?? 0) ? id : slow),
      auditRunIds[0] as string,
    );
  }, [states, auditRunIds]);

  const currentStage = states[slowestId]?.stage ?? 'scanning';
  const currentMessage = states[slowestId]?.message ?? 'Working…';
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  useEffect(() => {
    if (!completedRef.current && aggregatePercent >= 100) {
      completedRef.current = true;
      onComplete();
    }
  }, [aggregatePercent, onComplete]);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-ink/10 bg-paper-pure p-8 shadow-editorial md:p-10">
      <p className="font-display text-lg italic text-ink/70">In the exam room</p>
      <h2 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
        Examining your site
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{currentMessage}</p>

      {/* Aggregate bar */}
      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-ink-faint">
          <span>Progress</span>
          <span className="text-coral-deep">{Math.round(aggregatePercent)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-coral transition-all duration-500 ease-out"
            style={{ width: `${aggregatePercent}%` }}
          />
        </div>
      </div>

      {/* Per-device chips (dual mode) */}
      {auditRunIds.length > 1 && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {auditRunIds.map((id) => (
            <div key={id} className="rounded-2xl border border-ink/10 bg-paper-warm px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-tight text-ink">
                  {deviceLabels?.[id] ?? 'Device'}
                </span>
                <span className="font-mono text-[11px] text-ink-faint">{states[id]?.percent ?? 0}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-sky-deep transition-all duration-500"
                  style={{ width: `${states[id]?.percent ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="my-7 h-px w-full bg-ink/10" />

      {/* Stage stepper */}
      <ol className="space-y-2">
        {STAGES.map((stage, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li
              key={stage.key}
              className={`flex items-start gap-4 rounded-2xl px-4 py-3 transition-all ${
                active ? 'bg-coral-tint' : 'bg-transparent'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  done
                    ? 'border-good bg-good text-paper'
                    : active
                      ? 'border-coral-deep bg-coral-deep text-paper'
                      : 'border-ink/15 text-ink-faint'
                }`}
              >
                {done ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <div>
                <span className={`block text-sm font-semibold tracking-tight ${active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-faint'}`}>
                  {stage.label}
                </span>
                {active && <span className="mt-0.5 block text-xs text-ink-soft">{stage.desc}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
