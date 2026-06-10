import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job, type AuditJobPayload, createAuditQueue, createRedisConnection } from '@speed-doctor/queue';
import { db, auditRuns, auditScores, issues as dbIssues, recommendations as dbRecommendations } from '@speed-doctor/db';
import { eq } from 'drizzle-orm';
import { scanPage } from '@speed-doctor/scanner';
import { runLighthouse } from '@speed-doctor/lighthouse-engine';
import { analyzeDom } from '@speed-doctor/dom-analyzer';
import { correlateIssues } from '@speed-doctor/root-cause-engine';
import { generateReport } from '@speed-doctor/priority-engine';
import { type ScanDevice } from '@speed-doctor/shared-types';

const concurrency = Math.max(1, parseInt(process.env.WORKER_CONCURRENCY ?? '1', 10));

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection = createRedisConnection();
  public readonly queue = createAuditQueue(this.connection);
  public readonly worker = new Worker(
    'audit-jobs',
    async (job: Job<AuditJobPayload>) => this.processAuditJob(job),
    { connection: this.connection, concurrency },
  );

  constructor() {
    this.worker.on('completed', (job) => {
      this.logger.log(`Job completed: ${job.id}`);
    });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job failed: ${job?.id} — ${err.message}`, err.stack);
    });
    this.worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`, err.stack);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.queue.waitUntilReady();
    this.logger.log(`Queue ready. Concurrency: ${concurrency}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
    this.logger.log('QueueService shutdown complete.');
  }

  async addAuditJob(payload: AuditJobPayload) {
    return this.queue.add('audit', payload, {
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400, count: 100 },
    });
  }

  private async processAuditJob(job: Job<AuditJobPayload>) {
    const { auditRunId, url, device } = job.data;
    const activeDevice: ScanDevice = device === 'both' ? 'desktop' : device;

    this.logger.log(`Starting job ${job.id} for ${url} [${activeDevice}]`);

    try {
      // 1. Mark run as running
      await db.update(auditRuns).set({ status: 'running' }).where(eq(auditRuns.id, auditRunId));
      await job.updateProgress({ stage: 'scanning', percent: 10, message: 'Scanning page with Playwright...' });

      // 2. Playwright scan
      this.logger.log(`[${auditRunId}] Starting Playwright scan...`);
      const scanResult = await scanPage(url, activeDevice);
      await job.updateProgress({ stage: 'lighthouse', percent: 30, message: 'Running Lighthouse (multiple passes for accuracy)...' });

      // 3. Lighthouse scan
      this.logger.log(`[${auditRunId}] Starting Lighthouse scan...`);
      const lhResult = await runLighthouse(url, activeDevice);
      this.logger.log(`[${auditRunId}] Lighthouse scan complete.`);
      await job.updateProgress({ stage: 'dom', percent: 60, message: 'Analyzing DOM metrics...' });

      // 4. DOM analysis + correlation
      this.logger.log(`[${auditRunId}] Analyzing DOM and correlating issues...`);
      const rawIssues = analyzeDom(scanResult);
      const correlatedIssues = correlateIssues(lhResult, rawIssues);
      await job.updateProgress({ stage: 'ai', percent: 80, message: 'Prioritizing recommendations...' });

      // 5. Generate priority report (AI + fallbacks)
      this.logger.log(`[${auditRunId}] Generating report and AI explanations...`);
      const report = await generateReport(auditRunId, url, activeDevice, lhResult, correlatedIssues);
      await job.updateProgress({ stage: 'saving', percent: 90, message: 'Saving report to database...' });

      // 6. Save to DB in a transaction
      await db.transaction(async (tx) => {
        await tx
          .update(auditRuns)
          .set({ status: 'completed', completedAt: new Date() })
          .where(eq(auditRuns.id, auditRunId));

        await tx.insert(auditScores).values({
          auditRunId,
          performance: report.scores.performance,
          seo: report.scores.seo,
          accessibility: report.scores.accessibility,
          bestPractices: report.scores.bestPractices,
          lcpMs: report.metrics.lcp,
          cls: Math.round(report.metrics.cls * 100),
          inpMs: report.metrics.inp,
          fcpMs: report.metrics.fcp,
          ttfbMs: report.metrics.ttfb,
        });

        for (const issue of report.issues) {
          const [insertedIssue] = await tx
            .insert(dbIssues)
            .values({
              auditRunId,
              ruleId: issue.ruleId,
              category: issue.category,
              severity: issue.severity,
              title: issue.explanation.human.title,
              humanDescription: issue.explanation.human.explanation,
              devDescription: issue.explanation.developer.rootCause,
              elementSelector: issue.element ?? null,
              estimatedImpactScore: issue.estimatedImpactScore,
              issueData: JSON.stringify(issue.data ?? {}),
              isRootCause: issue.isRootCause,
            })
            .returning({ id: dbIssues.id });

          if (insertedIssue) {
            await tx.insert(dbRecommendations).values({
              issueId: insertedIssue.id,
              fixType: issue.priority,
              humanFix: issue.explanation.human.fix,
              codeFix: issue.explanation.developer.codeExample || issue.explanation.human.fix,
              estimatedGainScore: issue.estimatedGainMs ?? 0,
              difficulty: issue.severity,
            });
          }
        }
      });

      await job.updateProgress({ stage: 'saving', percent: 100, message: 'Completed successfully.' });
      this.logger.log(`Job ${job.id} complete — ${report.issues.length} issues found`);
      return { status: 'completed', auditRunId };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Job ${job.id} failed: ${err.message}`, err.stack);

      try {
        await db
          .update(auditRuns)
          .set({ status: 'failed', completedAt: new Date(), errorMessage: err.message })
          .where(eq(auditRuns.id, auditRunId));
      } catch (dbErr: unknown) {
        const dbError = dbErr instanceof Error ? dbErr : new Error(String(dbErr));
        this.logger.error('Failed to mark audit run as failed in DB:', dbError.stack);
      }

      throw err;
    }
  }
}
