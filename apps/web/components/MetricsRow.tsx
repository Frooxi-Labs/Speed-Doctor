import React from 'react';

interface MetricsRowProps {
  metrics: {
    lcp: number;
    cls: number;
    inp: number;
    fcp: number;
    ttfb: number;
    tbt: number;
  };
}

type Band = { label: string; color: string };

const GOOD: Band = { label: 'Good', color: '#3E9A87' };
const FAIR: Band = { label: 'Fair', color: '#D79A3C' };
const POOR: Band = { label: 'Poor', color: '#D9655E' };

function band(key: string, value: number): Band {
  switch (key) {
    case 'lcp': return value <= 2500 ? GOOD : value <= 4000 ? FAIR : POOR;
    case 'fcp': return value <= 1800 ? GOOD : value <= 3000 ? FAIR : POOR;
    case 'tbt': return value <= 200 ? GOOD : value <= 600 ? FAIR : POOR;
    case 'cls': return value <= 0.1 ? GOOD : value <= 0.25 ? FAIR : POOR;
    case 'ttfb': return value <= 800 ? GOOD : value <= 1800 ? FAIR : POOR;
    case 'inp': return value <= 200 ? GOOD : value <= 500 ? FAIR : POOR;
    default: return GOOD;
  }
}

function formatValue(key: string, value: number) {
  if (key === 'cls') return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

const ITEMS = [
  { key: 'lcp', abbr: 'LCP', title: 'Largest Contentful Paint', desc: 'Loading' },
  { key: 'inp', abbr: 'INP', title: 'Interaction to Next Paint', desc: 'Responsiveness' },
  { key: 'cls', abbr: 'CLS', title: 'Cumulative Layout Shift', desc: 'Visual stability' },
  { key: 'fcp', abbr: 'FCP', title: 'First Contentful Paint', desc: 'First render' },
  { key: 'tbt', abbr: 'TBT', title: 'Total Blocking Time', desc: 'Main thread' },
  { key: 'ttfb', abbr: 'TTFB', title: 'Time to First Byte', desc: 'Server response' },
];

export default function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-paper-pure p-6 shadow-card md:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink">Core Web Vitals</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Field metrics</span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-3">
        {ITEMS.map((item) => {
          const value = metrics[item.key as keyof MetricsRowProps['metrics']];
          const b = band(item.key, value);
          return (
            <div key={item.key} className="bg-paper-pure p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
                  {item.abbr}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: b.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label}
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">
                {formatValue(item.key, value)}
              </p>
              <p className="mt-1 text-xs text-ink-faint">{item.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
