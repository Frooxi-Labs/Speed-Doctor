import React from 'react';
import type { Metadata } from 'next';
import { DocLayout, Section, P, UL, LI, Code, Pre, Callout, Steps } from '../../components/Doc';
import { site } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Documentation — Speed Doctor',
  description: 'Install, configure, run and deploy Speed Doctor — the open-source website performance auditor.',
};

export default function DocsPage() {
  const cloneCmd = `git clone ${site.repo.url}.git\ncd ${site.repo.name}`;

  return (
    <DocLayout
      eyebrow="Documentation"
      title="Run Speed Doctor yourself"
      intro="Speed Doctor is a pnpm monorepo with a Next.js front-end, a NestJS API, and a background worker that drives Playwright, Lighthouse and AI. This guide takes you from clone to a working local install, and on to deployment."
    >
      <Section id="overview" title="What's inside">
        <P>The project is split into three runnable apps and a set of focused packages:</P>
        <UL>
          <LI><Code>apps/web</Code> — Next.js 15 front-end (this site).</LI>
          <LI><Code>apps/api</Code> — NestJS + Fastify REST API that accepts audit requests and streams progress.</LI>
          <LI><Code>apps/worker</Code> — NestJS worker that runs the scan pipeline off a BullMQ queue.</LI>
          <LI><Code>packages/*</Code> — scanner (Playwright), lighthouse-engine, dom-analyzer, root-cause-engine, priority-engine, ai-engine, db (Drizzle), queue (BullMQ) and shared-types.</LI>
        </UL>
      </Section>

      <Section id="prerequisites" title="Prerequisites">
        <UL>
          <LI><strong>Node.js 20+</strong> and <strong>pnpm 11+</strong> (<Code>corepack enable</Code> will provision pnpm).</LI>
          <LI><strong>A PostgreSQL database</strong> — a free <a className="text-sky-deep hover:underline" href="https://neon.tech" target="_blank" rel="noopener noreferrer">Neon</a> project works out of the box.</LI>
          <LI><strong>A Redis instance</strong> — <a className="text-sky-deep hover:underline" href="https://upstash.com" target="_blank" rel="noopener noreferrer">Upstash</a> (cloud) or the bundled Docker Compose service for local dev.</LI>
          <LI><strong>Chrome/Chromium</strong> — installed automatically by Playwright; needed by the worker.</LI>
          <LI><em>Optional:</em> an <a className="text-sky-deep hover:underline" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter</a> API key for AI explanations (without it, built-in templates are used).</LI>
        </UL>
      </Section>

      <Section id="quick-start" title="Quick start">
        <Steps>
          <>
            <P><strong>Clone and install.</strong></P>
            <Pre caption="terminal">{`${cloneCmd}\npnpm install`}</Pre>
          </>
          <>
            <P><strong>Create your environment file</strong> from the template and fill in the values.</P>
            <Pre caption="terminal">{`cp .env.example .env   # Windows: copy .env.example .env`}</Pre>
            <P>See <a className="text-sky-deep hover:underline" href="#env">Environment variables</a> below for what each one means.</P>
          </>
          <>
            <P><strong>Start Redis</strong> (skip if you use Upstash and set <Code>REDIS_URL</Code> accordingly).</P>
            <Pre caption="terminal">{`docker compose up -d redis`}</Pre>
          </>
          <>
            <P><strong>Create the database schema</strong> against your Postgres database.</P>
            <Pre caption="terminal">{`pnpm --filter @speed-doctor/db exec drizzle-kit push`}</Pre>
          </>
          <>
            <P><strong>Run everything</strong> (web, API and worker together).</P>
            <Pre caption="terminal">{`pnpm dev`}</Pre>
            <P>The app is now at <Code>http://localhost:3000</Code>, the API at <Code>http://localhost:3001</Code>.</P>
          </>
        </Steps>
      </Section>

      <Section id="env" title="Environment variables">
        <P>All variables live in a single root <Code>.env</Code>. The web app only needs <Code>NEXT_PUBLIC_API_URL</Code>; the rest are read by the API and worker.</P>
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-warm font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              <tr>
                <th className="px-4 py-3">Variable</th>
                <th className="px-4 py-3">Required</th>
                <th className="px-4 py-3">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 text-ink-soft">
              {[
                ['DATABASE_URL', 'Yes', 'Postgres connection string (append ?sslmode=require for Neon).'],
                ['REDIS_URL', 'Yes', 'Redis connection (use rediss:// for Upstash TLS).'],
                ['OPENROUTER_API_KEY', 'No', 'Enables AI explanations; falls back to templates if unset.'],
                ['OPENROUTER_MODEL', 'No', 'Override the model (default openai/gpt-4o-mini).'],
                ['WORKER_CONCURRENCY', 'No', 'How many audits the worker runs at once (default 1).'],
                ['ALLOWED_ORIGINS', 'No', 'Comma-separated CORS allowlist (default http://localhost:3000).'],
                ['RATE_LIMIT_MAX', 'No', 'Max audit requests per IP per minute (default 10).'],
                ['NEXT_PUBLIC_API_URL', 'Yes', 'Public URL of the API the browser calls.'],
              ].map(([name, req, purpose]) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink">{name}</td>
                  <td className="px-4 py-3">{req}</td>
                  <td className="px-4 py-3">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="warning" title="Never commit .env">
          Your real credentials belong only in <Code>.env</Code>, which is git-ignored. Commit changes to <Code>.env.example</Code> (placeholders) instead. See the <a className="text-sky-deep hover:underline" href={`${site.repo.url}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer">security policy</a>.
        </Callout>
      </Section>

      <Section id="usage" title="Using the app">
        <Steps>
          <><P>Open <Code>http://localhost:3000</Code> and enter a website URL.</P></>
          <><P>Pick a test environment: <strong>Both</strong> (mobile + desktop), <strong>Mobile</strong>, or <strong>Desktop</strong>.</P></>
          <><P>Watch the live progress as the page is scanned, measured, analysed and diagnosed.</P></>
          <><P>Read the report: category scores, Core Web Vitals, the heaviest assets, and each issue with a plain-English and a developer view. In “Both” mode, switch devices with the tabs at the top.</P></>
        </Steps>
      </Section>

      <Section id="pipeline" title="How an audit works">
        <P>Submitting a URL creates an audit run and enqueues a job. The worker then:</P>
        <UL>
          <LI><strong>Scans</strong> the page with Playwright (real Chromium), capturing HTML, assets and timings.</LI>
          <LI><strong>Measures</strong> Core Web Vitals with Lighthouse, in an isolated child process.</LI>
          <LI><strong>Analyses</strong> the DOM with six detectors (images, fonts, JS, video, third-party, DOM size).</LI>
          <LI><strong>Correlates</strong> findings to the metrics they hurt and ranks root causes.</LI>
          <LI><strong>Explains</strong> each issue via AI (or templates) and saves the report.</LI>
        </UL>
        <P>For <strong>Both</strong> mode the front-end fires two runs (one per device) and shows a combined progress view, then device tabs.</P>
      </Section>

      <Section id="deploy" title="Deployment">
        <P><strong>Front-end → Vercel.</strong> Import the repo, set the project root to <Code>apps/web</Code>, add <Code>NEXT_PUBLIC_API_URL</Code> pointing at your deployed API, and Vercel builds and hosts it automatically on every push.</P>
        <Callout type="warning" title="The API and worker can't run on Vercel">
          The worker is a long-running process that launches real Chrome (Playwright + Lighthouse), so it needs a normal Node host — <strong>Railway, Render, Fly.io or a VPS</strong> — plus managed Redis (Upstash) and Postgres (Neon). Deploy <Code>apps/api</Code> and <Code>apps/worker</Code> there, then point the Vercel front-end at the API URL via <Code>ALLOWED_ORIGINS</Code> and <Code>NEXT_PUBLIC_API_URL</Code>.
        </Callout>
        <UL>
          <LI><strong>apps/api</strong> — <Code>pnpm --filter @speed-doctor/api build</Code> then <Code>pnpm --filter @speed-doctor/api start</Code>.</LI>
          <LI><strong>apps/worker</strong> — <Code>pnpm --filter @speed-doctor/worker build</Code> then <Code>pnpm --filter @speed-doctor/worker start</Code>.</LI>
        </UL>
      </Section>

      <Section id="troubleshooting" title="Troubleshooting">
        <UL>
          <LI><strong>“performance mark has not been set”</strong> — Lighthouse runs in a child process to prevent this; make sure the worker was restarted after pulling changes.</LI>
          <LI><strong>Next dev shows missing-chunk / ENOENT errors</strong> — only run <em>one</em> <Code>next dev</Code> at a time; the dev script uses Turbopack to avoid cache corruption.</LI>
          <LI><strong>CORS errors in the browser</strong> — set <Code>ALLOWED_ORIGINS</Code> on the API to include your web origin.</LI>
          <LI><strong>Scores look different from PageSpeed Insights</strong> — that&apos;s expected; see <a className="text-sky-deep hover:underline" href="/accuracy">Why the gap?</a></LI>
        </UL>
      </Section>

      <Section title="Next steps">
        <P>
          Want to help improve Speed Doctor? Read the <a className="text-sky-deep hover:underline" href="/contribute">contribution guide</a> or open an issue on{' '}
          <a className="text-sky-deep hover:underline" href={site.repo.url} target="_blank" rel="noopener noreferrer">GitHub</a>.
        </P>
      </Section>
    </DocLayout>
  );
}
