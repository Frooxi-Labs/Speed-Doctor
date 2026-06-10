'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ScanDevice } from '@speed-doctor/shared-types';
import SiteNav, { GitHubIcon, CoffeeIcon } from '../components/SiteNav';
import SiteFooter from '../components/SiteFooter';
import { site } from '../lib/site';

type DeviceChoice = ScanDevice | 'both';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function postAudit(url: string, device: ScanDevice): Promise<string> {
  const response = await fetch(`${API_URL}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, device }),
  });
  if (!response.ok) {
    let message = 'Failed to submit audit.';
    try {
      const body = await response.json();
      message = body?.message ?? message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  const data = await response.json();
  if (!data.auditRunId) throw new Error('No audit run ID returned from the server.');
  return data.auditRunId as string;
}

const DEVICES: { value: DeviceChoice; label: string; note: string }[] = [
  { value: 'both', label: 'Both', note: 'Mobile + Desktop' },
  { value: 'mobile', label: 'Mobile', note: 'Emulated phone' },
  { value: 'desktop', label: 'Desktop', note: 'Full viewport' },
];

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<DeviceChoice>('both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || loading) return;

    setError(null);

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
    try {
      new URL(cleanUrl);
    } catch {
      setError('Please enter a valid website URL.');
      return;
    }

    setLoading(true);
    try {
      if (device === 'both') {
        const [desktopId, mobileId] = await Promise.all([
          postAudit(cleanUrl, 'desktop'),
          postAudit(cleanUrl, 'mobile'),
        ]);
        router.push(`/report/${desktopId}?m=${mobileId}`);
      } else {
        const id = await postAudit(cleanUrl, device);
        router.push(`/report/${id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server connection failed.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      {/* ---------- Top navigation ---------- */}
      <SiteNav />

      {/* ---------- Coral hero band ---------- */}
      <section className="grain relative bg-coral pt-14 pb-44 md:pt-20 md:pb-52">
        {/* Decorative ECG / pulse line */}
        <svg
          aria-hidden
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-10 h-32 w-full opacity-[0.18]"
        >
          <path
            d="M0,120 L320,120 L350,120 L370,60 L395,170 L420,30 L445,120 L760,120 L788,120 L808,82 L832,150 L856,40 L880,120 L1200,120"
            fill="none"
            stroke="#16273b"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
          <p className="animate-rise-in font-display text-xl italic text-ink/80">
            Website performance, diagnosed
          </p>
          <h1 className="animate-rise-in animate-delay-1 mt-3 font-display text-[19vw] font-light leading-[0.86] tracking-tightest text-ink sm:text-8xl md:text-[8.5rem]">
            Speed<span className="font-semibold italic"> Doctor</span>
          </h1>
          <p className="animate-rise-in animate-delay-2 mt-7 max-w-md text-[15px] leading-relaxed text-ink/75">
            A clinical read on what slows your site down — Core Web Vitals, root-cause
            diagnostics, and developer-ready fixes. Measured on mobile and desktop in one pass.
          </p>
        </div>
      </section>

      {/* ---------- Form card straddling the divide ---------- */}
      <section className="relative z-10 mx-auto -mt-32 max-w-3xl px-6 pb-24 md:px-10">
        <form
          onSubmit={handleSubmit}
          className="animate-rise-in animate-delay-3 rounded-[28px] border border-ink/10 bg-paper-pure p-7 shadow-editorial md:p-10"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              Run a diagnosis
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              01 / Examine
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-coral-deep/30 bg-coral-tint px-4 py-3 text-sm font-medium text-coral-deep"
            >
              {error}
            </div>
          )}

          {/* URL field */}
          <label className="mt-7 block">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Website address
            </span>
            <input
              type="text"
              inputMode="url"
              placeholder="yourdomain.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="mt-2 w-full border-b-2 border-ink/15 bg-transparent pb-3 font-display text-2xl text-ink outline-none transition-colors placeholder:text-ink-faint/60 focus:border-coral disabled:opacity-50 md:text-3xl"
            />
          </label>

          {/* Device segmented control */}
          <div className="mt-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Test environment
            </span>
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-ink/10 bg-paper-warm p-1.5">
              {DEVICES.map((d) => {
                const active = device === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDevice(d.value)}
                    disabled={loading}
                    className={`group relative rounded-xl px-3 py-3 text-left transition-all ${
                      active
                        ? 'bg-ink text-paper shadow-card'
                        : 'text-ink hover:bg-paper-pure'
                    }`}
                  >
                    <span className="block text-sm font-semibold tracking-tight">{d.label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] ${
                        active ? 'text-paper/65' : 'text-ink-faint'
                      }`}
                    >
                      {d.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !url}
            className="group mt-8 flex w-full items-center justify-between rounded-2xl bg-coral px-6 py-4 text-left transition-all hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="font-display text-lg font-medium text-ink group-hover:text-paper">
              {loading ? 'Examining your site…' : 'Begin diagnosis'}
            </span>
            <span
              className={`text-ink transition-transform group-hover:translate-x-1 group-hover:text-paper ${
                loading ? 'animate-pulse-soft' : ''
              }`}
              aria-hidden
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        </form>

        {/* Trust row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          <span>Lighthouse engine</span>
          <span className="text-coral-deep">/</span>
          <span>Real DOM analysis</span>
          <span className="text-coral-deep">/</span>
          <span>AI root-cause</span>
        </div>
      </section>

      {/* ---------- Explore (links to the new pages) ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/docs', eyebrow: 'Documentation', title: 'Install & self-host', body: 'Clone, configure and run the full stack locally or on your own infrastructure.' },
            { href: '/accuracy', eyebrow: 'Accuracy', title: 'Why scores differ from PSI', body: 'Understand the gap between Speed Doctor and Google PageSpeed Insights.' },
            { href: '/contribute', eyebrow: 'Open source', title: 'Contribute', body: 'Good first issues, coding standards and how to open a great pull request.' },
          ].map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-ink/10 bg-paper-pure p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-ink/20"
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-coral-deep">{card.eyebrow}</span>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink transition-transform group-hover:translate-x-1">
                Read more
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- About the author ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="grid items-center gap-8 rounded-[28px] border border-ink/10 bg-paper-pure p-8 shadow-card md:grid-cols-[auto_1fr] md:p-10">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-ink shadow-editorial">
            <img
              src="/tanvir-almas.jpg"
              alt={site.author.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">{site.author.role}</span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
              Built by {site.author.name}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{site.author.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={site.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-coral hover:text-ink"
              >
                <GitHubIcon /> GitHub profile
              </a>
              <a
                href={site.repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper-warm"
              >
                View the repository
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Buy me a coffee ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div className="grain relative overflow-hidden rounded-[28px] bg-coral p-8 md:p-12">
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink/70">Support the project</span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                If Speed Doctor saved you time, buy me a coffee
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
                It&apos;s free and open source forever. A coffee keeps the audits running and the
                features coming.
              </p>
            </div>
            <a
              href={site.coffee.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-ink px-6 py-4 font-display text-lg font-semibold text-paper transition-transform hover:scale-[1.03]"
            >
              <CoffeeIcon className="h-5 w-5" /> {site.coffee.label}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
