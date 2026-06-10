'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '../lib/site';

function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function CoffeeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" strokeLinejoin="round" />
      <path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17" strokeLinejoin="round" />
      <path d="M8 3c-.5.8-.5 1.5 0 2.3M12 3c-.5.8-.5 1.5 0 2.3" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="relative z-30 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        {/* Brand */}
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
          Speed<span className="text-coral-deep">·</span>Doctor
        </Link>

        {/* Center links (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors ${
                isActive(item.href) ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-warm hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href={site.coffee.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-coral hover:border-coral"
          >
            <CoffeeIcon />
            <span className="hidden lg:inline">Coffee</span>
          </a>
          <a
            href={site.author.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-coral hover:text-ink"
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-ink/10 bg-paper px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  isActive(item.href) ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-warm'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <a
                href={site.coffee.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink"
              >
                <CoffeeIcon /> Coffee
              </a>
              <a
                href={site.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-paper"
              >
                <GitHubIcon /> GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export { GitHubIcon, CoffeeIcon };
