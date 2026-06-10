import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createAuditQueue, createRedisConnection, type AuditJobPayload } from '@speed-doctor/queue';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection = createRedisConnection();
  private readonly queue = createAuditQueue(this.connection);

  async addAuditJob(payload: AuditJobPayload) {
    return this.queue.add('audit', payload, {
      jobId: payload.auditRunId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400, count: 100 },
    });
  }

  async getJob(jobId: string) {
    return this.queue.getJob(jobId);
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
