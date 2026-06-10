import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { type ScanDevice, type LighthouseResult } from '@speed-doctor/shared-types';
import { parseLighthouseResult } from './parser';

const LH_TIMEOUT_MS = Number(process.env.LH_TIMEOUT_MS ?? 120_000);
const LH_MAX_CONCURRENCY = Math.max(1, parseInt(process.env.LH_MAX_CONCURRENCY ?? '1', 10));
// Number of Lighthouse passes per audit. We report the MEDIAN run to remove
// single-run noise (ads, lazy content, third-party jitter) that otherwise
// drags scores down unpredictably — the same approach Lighthouse CI/PSI use.
// Capped at 5 to bound scan time. Set LH_RUNS=1 to disable.
const LH_RUNS = Math.min(5, Math.max(1, parseInt(process.env.LH_RUNS ?? '3', 10)));

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

function resolveSibling(fileName: string): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, fileName), // tsx/dev: alongside runner.ts in src
    join(here, '..', 'src', fileName), // compiled dist -> ../src
    join(here, '..', fileName),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function resolveChildScript(): string | null {
  return resolveSibling('lh-child.mjs');
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
  // Shares the PSI-aligned throttling presets used by the child-process path.
  // Resolved from src (like lh-child.mjs) since .mjs assets aren't emitted to dist.
  const configPath = resolveSibling('lh-config.mjs');
  if (!configPath) throw new Error('Could not locate lh-config.mjs');
  const { buildLighthouseOptions } = await import(pathToFileURL(configPath).href);
  const options = buildLighthouseOptions(device, chrome.port);
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

async function runLighthouseOnce(url: string, device: ScanDevice): Promise<LighthouseResult> {
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

/**
 * Pick the representative (median) run. We return one run's results unchanged
 * rather than averaging metrics independently, so the reported scores and
 * metrics stay internally consistent. The median is chosen by performance
 * score; ties fall back to the run with the median LCP.
 */
function selectMedianRun(results: LighthouseResult[]): LighthouseResult {
  const sorted = [...results].sort((a, b) => {
    const perfDiff = a.scores.performance - b.scores.performance;
    if (perfDiff !== 0) return perfDiff;
    return a.metrics.lcp - b.metrics.lcp;
  });
  // Lower-middle element for even counts — conservative but stable.
  return sorted[Math.floor((sorted.length - 1) / 2)] as LighthouseResult;
}

export async function runLighthouse(url: string, device: ScanDevice): Promise<LighthouseResult> {
  if (LH_RUNS === 1) {
    return runLighthouseOnce(url, device);
  }

  const results: LighthouseResult[] = [];
  let lastError: unknown;
  for (let i = 0; i < LH_RUNS; i++) {
    try {
      results.push(await runLighthouseOnce(url, device));
    } catch (err) {
      lastError = err;
    }
  }

  if (results.length === 0) {
    throw lastError instanceof Error ? lastError : new Error('All Lighthouse runs failed');
  }

  return selectMedianRun(results);
}
