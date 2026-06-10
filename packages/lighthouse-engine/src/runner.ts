import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { type ScanDevice, type LighthouseResult } from '@speed-doctor/shared-types';
import { parseLighthouseResult } from './parser';

const LH_TIMEOUT_MS = Number(process.env.LH_TIMEOUT_MS ?? 120_000);
const LH_MAX_CONCURRENCY = Math.max(1, parseInt(process.env.LH_MAX_CONCURRENCY ?? '1', 10));

/* ------------------------------------------------------------------ *
 * Bounded concurrency — caps how many Lighthouse child processes run
 * at once so a high WORKER_CONCURRENCY can't exhaust memory by
 * launching many Chrome instances simultaneously.
 * ------------------------------------------------------------------ */
let active = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<() => void> {
  if (active >= LH_MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active++;
  return () => {
    active--;
    waiters.shift()?.();
  };
}

function resolveChildScript(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, 'lh-child.mjs'), // tsx/dev: alongside runner.ts in src
    join(here, '..', 'src', 'lh-child.mjs'), // compiled dist -> ../src
    join(here, '..', 'lh-child.mjs'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

/* ------------------------------------------------------------------ *
 * Primary path: run Lighthouse in an isolated child process.
 * ------------------------------------------------------------------ */
function runInSubprocess(script: string, url: string, device: ScanDevice): Promise<LighthouseResult> {
  return new Promise<LighthouseResult>((resolve, reject) => {
    const child = spawn(process.execPath, [script, JSON.stringify({ url, device })], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Lighthouse timed out after ${LH_TIMEOUT_MS}ms`));
    }, LH_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Lighthouse child exited with code ${code}: ${stderr.trim() || 'unknown error'}`));
        return;
      }
      try {
        resolve(parseLighthouseResult(JSON.parse(stdout)));
      } catch (err) {
        reject(new Error(`Failed to parse Lighthouse output: ${err instanceof Error ? err.message : String(err)}`));
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * Fallback path: run in-process if the child script can't be located
 * (e.g. an unusual bundled deploy). Serialized + mark-cleaned to avoid
 * the global perf-mark collisions as best as possible.
 * ------------------------------------------------------------------ */
let inProcessChain: Promise<void> = Promise.resolve();

function clearLighthouseMarks(): void {
  try {
    for (const entry of performance.getEntriesByType('mark')) {
      if (entry.name.startsWith('start lh:') || entry.name.startsWith('end lh:')) {
        performance.clearMarks(entry.name);
      }
    }
    for (const entry of performance.getEntriesByType('measure')) {
      if (entry.name.startsWith('lh:')) performance.clearMeasures(entry.name);
    }
  } catch {
    /* best effort */
  }
}

async function runInProcess(url: string, device: ScanDevice): Promise<LighthouseResult> {
  const previous = inProcessChain;
  let release!: () => void;
  inProcessChain = previous.then(() => new Promise<void>((r) => { release = r; }));
  await previous;

  clearLighthouseMarks();
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const options = {
    logLevel: 'error' as const,
    output: 'json' as const,
    port: chrome.port,
    formFactor: device === 'mobile' ? ('mobile' as const) : ('desktop' as const),
    screenEmulation:
      device === 'mobile'
        ? { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'simulate' as const,
  };
  try {
    const result = await lighthouse(url, options);
    if (!result) throw new Error('Lighthouse audit failed to yield any results.');
    const lhJson = typeof result.report === 'string' ? JSON.parse(result.report) : result.lhr;
    return parseLighthouseResult(lhJson);
  } finally {
    try { await chrome.kill(); } catch { /* ignore */ }
    clearLighthouseMarks();
    release();
  }
}

export async function runLighthouse(url: string, device: ScanDevice): Promise<LighthouseResult> {
  const releaseSlot = await acquireSlot();
  try {
    const script = resolveChildScript();
    return script
      ? await runInSubprocess(script, url, device)
      : await runInProcess(url, device);
  } finally {
    releaseSlot();
  }
}
