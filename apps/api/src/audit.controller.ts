import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
  MessageEvent,
  NotFoundException,
  BadRequestException,
  Inject,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  db,
  users,
  projects,
  websites,
  auditRuns,
  auditScores,
  issues as dbIssues,
  recommendations as dbRecommendations,
} from '@speed-doctor/db';
import { eq, desc } from 'drizzle-orm';
import { Observable, interval } from 'rxjs';
import { map, switchMap, takeWhile, distinctUntilChanged } from 'rxjs/operators';
import { type AuditReport, type PrioritizedIssue, type ScanDevice } from '@speed-doctor/shared-types';
import { RateLimitGuard } from './guards/rate-limit.guard';
import dns from 'dns';
import net from 'net';

interface StartAuditDto {
  url: string;
  device?: ScanDevice | 'both';
}

const VALID_DEVICES: ReadonlySet<string> = new Set(['desktop', 'mobile', 'both']);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    const mapped = lower.match(/(?:::ffff:|::)((?:\d{1,3}\.){3}\d{1,3})$/);
    if (mapped && mapped[1]) return isPrivateIpv4(mapped[1]);
    if (/^fe[89ab]/.test(lower) || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('ff')) return true;
    return false;
  }
  return true; // not a valid IP literal — fail closed
}

async function isSsrfUrl(hostname: string): Promise<boolean> {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (net.isIP(h)) return isPrivateIp(h);
  try {
    const results = await Promise.allSettled([dns.promises.resolve4(h), dns.promises.resolve6(h)]);
    const addresses = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    if (addresses.length === 0) {
      const all = await dns.promises.lookup(h, { all: true });
      return all.length === 0 || all.some((a) => isPrivateIp(a.address));
    }
    return addresses.some(isPrivateIp);
  } catch {
    return true; // unresolvable — fail closed
  }
}

function normalizeUrl(raw: string): string {
  const parsed = new URL(raw);
  parsed.hostname = parsed.hostname.toLowerCase();
  // Remove trailing slash from pathname (keep root as '/')
  if (parsed.pathname !== '/') {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }
  // Remove default ports
  if ((parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')) {
    parsed.port = '';
  }
  return parsed.toString();
}

async function getOrCreateGuestUser() {
  const [existing] = await db.select().from(users).where(eq(users.clerkId, 'guest'));
  if (existing) return existing;

  const [newUser] = await db
    .insert(users)
    .values({ clerkId: 'guest', email: 'guest@speeddoctor.com', name: 'Guest User', plan: 'free' })
    .returning();
  return newUser;
}

async function getOrCreateGuestProject(userId: string) {
  const [existing] = await db.select().from(projects).where(eq(projects.slug, 'guest-project'));
  if (existing) return existing;

  const [newProject] = await db
    .insert(projects)
    .values({ userId, name: 'Guest Project', slug: 'guest-project' })
    .returning();
  return newProject;
}

async function getOrCreateWebsite(projectId: string, url: string) {
  const [existing] = await db
    .select()
    .from(websites)
    .where(eq(websites.url, url));
  if (existing) return existing;

  const [newWebsite] = await db
    .insert(websites)
    .values({ projectId, url })
    .returning();
  return newWebsite;
}

@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(@Inject(QueueService) private readonly queueService: QueueService) {}

  @Post()
  @UseGuards(RateLimitGuard)
  async enqueueAudit(@Body() body: StartAuditDto) {
    const { url, device = 'desktop' } = body;
    this.logger.log(`Received audit request for ${url} [${device}]`);

    if (!url || typeof url !== 'string') {
      throw new BadRequestException('URL is required.');
    }

    if (typeof device !== 'string' || !VALID_DEVICES.has(device)) {
      throw new BadRequestException('device must be one of: desktop, mobile, both.');
    }

    // 1. Parse and validate URL scheme
    let targetUrl: string;
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new BadRequestException('Only http and https URLs are supported.');
      }
      targetUrl = normalizeUrl(url.trim());
    } catch (err) {
      throw new BadRequestException('Invalid URL format. Please provide a full URL including http:// or https://');
    }

    // 2. SSRF protection — block private/internal IPs at the API layer
    try {
      const hostname = new URL(targetUrl).hostname;
      const blocked = await isSsrfUrl(hostname);
      if (blocked) {
        throw new BadRequestException('Scanning private or internal network addresses is not allowed.');
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Could not resolve the provided hostname.');
    }

    // 3. Resolve default user / project / website
    const user = await getOrCreateGuestUser();
    if (!user) throw new Error('Failed to resolve guest user');
    const project = await getOrCreateGuestProject(user.id);
    if (!project) throw new Error('Failed to resolve guest project');
    const website = await getOrCreateWebsite(project.id, targetUrl);
    if (!website) throw new Error('Failed to resolve guest website');

    // 4. Create pending audit run record
    const [newRun] = await db
      .insert(auditRuns)
      .values({
        websiteId: website.id,
        status: 'pending',
        triggeredBy: 'user',
        deviceType: device,
      })
      .returning();

    if (!newRun) throw new Error('Failed to create audit run record.');

    // 5. Enqueue job
    await this.queueService.addAuditJob({
      auditRunId: newRun.id,
      websiteId: website.id,
      url: targetUrl,
      device,
      triggeredBy: 'user',
      requestedAt: new Date().toISOString(),
    });

    this.logger.log(`Audit queued: ${newRun.id} for ${targetUrl}`);

    return {
      auditRunId: newRun.id,
      status: 'queued',
      pollUrl: `/api/audit/${newRun.id}`,
    };
  }

  @Get(':id')
  async getAudit(@Param('id') id: string): Promise<AuditReport | { auditRunId: string; status: string; errorMessage?: string | null }> {
    // 1. Fetch audit run
    const [run] = await db
      .select({
        id: auditRuns.id,
        status: auditRuns.status,
        deviceType: auditRuns.deviceType,
        errorMessage: auditRuns.errorMessage,
        createdAt: auditRuns.createdAt,
        completedAt: auditRuns.completedAt,
        url: websites.url,
      })
      .from(auditRuns)
      .innerJoin(websites, eq(auditRuns.websiteId, websites.id))
      .where(eq(auditRuns.id, id));

    if (!run) throw new NotFoundException('Audit run not found.');

    if (run.status !== 'completed') {
      return { auditRunId: run.id, status: run.status, errorMessage: run.errorMessage };
    }

    // 2. Fetch scores
    const [score] = await db
      .select()
      .from(auditScores)
      .where(eq(auditScores.auditRunId, id));

    if (!score) throw new NotFoundException('Audit scores not found.');

    // 3. Fetch issues + recommendations, ordered by impact score descending
    const dbIssuesList = await db
      .select({ issue: dbIssues, rec: dbRecommendations })
      .from(dbIssues)
      .leftJoin(dbRecommendations, eq(dbIssues.id, dbRecommendations.issueId))
      .where(eq(dbIssues.auditRunId, id))
      .orderBy(desc(dbIssues.estimatedImpactScore));

    // 4. Map to PrioritizedIssue[]
    const issuesList: PrioritizedIssue[] = dbIssuesList.map(({ issue, rec }, index) => {
      const affectedMetrics: Array<'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb' | 'tbt'> = [];
      const ruleCategory = issue.ruleId.split('/')[0];
      if (ruleCategory === 'images') {
        affectedMetrics.push('lcp', 'fcp');
      } else if (ruleCategory === 'fonts' || issue.ruleId === 'js/render-blocking') {
        affectedMetrics.push('fcp', 'lcp', 'tbt');
      } else if (ruleCategory === 'js') {
        affectedMetrics.push('tbt', 'inp');
      } else if (ruleCategory === 'third-party') {
        affectedMetrics.push('tbt', 'inp', 'lcp');
      } else if (ruleCategory === 'dom') {
        affectedMetrics.push('cls', 'inp', 'tbt');
      } else {
        affectedMetrics.push('lcp');
      }

      let parsedData: Record<string, unknown> = {};
      try {
        parsedData = issue.issueData ? (JSON.parse(issue.issueData) as Record<string, unknown>) : {};
      } catch {
        parsedData = {};
      }

      const severity = issue.severity as 'critical' | 'high' | 'medium' | 'low';
      const priorityMap: Record<string, PrioritizedIssue['priority']> = {
        critical: 'critical',
        high: 'high',
        medium: 'medium',
        low: 'low',
      };

      const issueObj: PrioritizedIssue = {
        ruleId: issue.ruleId,
        category: issue.category as PrioritizedIssue['category'],
        severity,
        data: parsedData,
        estimatedImpactScore: issue.estimatedImpactScore,
        affectedMetrics,
        isRootCause: issue.isRootCause,
        rank: index + 1,
        priority: priorityMap[severity] ?? 'low',
        priorityScore: issue.estimatedImpactScore,
        explanation: {
          human: {
            title: issue.title,
            explanation: issue.humanDescription,
            businessImpact: 'This issue negatively impacts loading speed and user experience. Fixing it can improve conversion rates.',
            fix: rec?.humanFix ?? '',
          },
          developer: {
            title: issue.title,
            rootCause: issue.devDescription,
            technicalImpact: 'Increases page weight and main-thread blocking time.',
            codeExample: rec?.codeFix ?? rec?.humanFix ?? '',
            references: ['https://web.dev/vitals/'],
          },
        },
      };

      if (issue.elementSelector) {
        issueObj.element = issue.elementSelector;
      }

      if (rec?.estimatedGainScore != null) {
        issueObj.estimatedGainMs = rec.estimatedGainScore;
      }

      return issueObj;
    });

    // 5. Build full report
    const criticalCount = issuesList.filter((i) => i.priority === 'critical').length;
    const highCount = issuesList.filter((i) => i.priority === 'high').length;
    const estimatedGain = issuesList.reduce((acc, curr) => acc + (curr.estimatedGainMs ?? 0), 0);

    const report: AuditReport = {
      auditRunId: run.id,
      url: run.url,
      device: run.deviceType === 'mobile' ? 'mobile' : 'desktop',
      scannedAt: run.createdAt.toISOString(),
      scores: {
        performance: score.performance,
        seo: score.seo,
        accessibility: score.accessibility,
        bestPractices: score.bestPractices,
      },
      metrics: {
        lcp: score.lcpMs,
        cls: score.cls / 100,
        inp: score.inpMs,
        fcp: score.fcpMs,
        ttfb: score.ttfbMs,
        speedIndex: score.lcpMs,
        tbt: 0,
      },
      summary: { totalIssues: issuesList.length, criticalCount, highCount, estimatedGain },
      issues: issuesList,
      shareableLink: `/report/${run.id}`,
    };

    return report;
  }

  @Sse(':id/status')
  status(@Param('id') id: string): Observable<MessageEvent> {
    return interval(1500).pipe(
      switchMap(async () => {
        const [run] = await db
          .select({ status: auditRuns.status, errorMessage: auditRuns.errorMessage })
          .from(auditRuns)
          .where(eq(auditRuns.id, id));

        if (!run) {
          return { data: { stage: 'failed', percent: 100, message: 'Audit run not found.' } };
        }

        if (run.status === 'completed') {
          return { data: { stage: 'saving', percent: 100, message: 'Completed successfully.' } };
        }

        if (run.status === 'failed') {
          return { data: { stage: 'failed', percent: 100, message: run.errorMessage ?? 'Audit failed.' } };
        }

        const job = await this.queueService.getJob(id);
        if (job) {
          const progress = job.progress;
          if (progress && typeof progress === 'object') {
            return { data: progress };
          }
        }

        return {
          data: {
            stage: run.status === 'running' ? 'scanning' : 'queued',
            percent: run.status === 'running' ? 20 : 5,
            message: run.status === 'running' ? 'Initializing scan...' : 'Queued, waiting for worker...',
          },
        };
      }),
      map((progressObj) => ({ data: progressObj.data } as MessageEvent)),
      distinctUntilChanged((a, b) => JSON.stringify(a.data) === JSON.stringify(b.data)),
      takeWhile((event: MessageEvent & { data: { percent?: number; stage?: string } }) => {
        const d = event.data as { percent?: number; stage?: string };
        return !(d.percent === 100 || d.stage === 'failed');
      }, true),
    );
  }
}
