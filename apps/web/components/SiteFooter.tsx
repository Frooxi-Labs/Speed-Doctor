import React from 'react';
import Link from 'next/link';
import { site } from '../lib/site';
import { GitHubIcon, CoffeeIcon } from './SiteNav';

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper-warm">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Speed<span className="text-coral-deep">·</span>Doctor
            </span>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Open-source website performance diagnostics. Lighthouse metrics, real DOM analysis and
              AI root-cause fixes — free to use and self-host.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={site.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-coral hover:text-ink"
              >
                <GitHubIcon className="h-3.5 w-3.5" /> Star on GitHub
              </a>
              <a
                href={site.coffee.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-coral hover:border-coral"
              >
                <CoffeeIcon className="h-3.5 w-3.5" /> {site.coffee.label}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Product</span>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/" className="text-ink-soft hover:text-ink">Run an audit</Link></li>
                <li><Link href="/docs" className="text-ink-soft hover:text-ink">Documentation</Link></li>
                <li><Link href="/accuracy" className="text-ink-soft hover:text-ink">Why the gap?</Link></li>
              </ul>
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Open source</span>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/contribute" className="text-ink-soft hover:text-ink">Contribute</Link></li>
                <li><a href={site.repo.url} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-ink">Repository</a></li>
                <li><a href={site.repo.issues} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-ink">Issues</a></li>
              </ul>
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Made by</span>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href={site.author.github} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-ink">{site.author.name}</a></li>
                <li><a href={site.coffee.url} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-ink">Support the project</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-ink/10 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {site.author.name}. Released under the {site.repo.license} License.</span>
          <span className="font-mono uppercase tracking-widest">Built with Next.js · NestJS · Lighthouse</span>
        </div>
      </div>
    </footer>
  );
}
