import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { AUDIT_QUEUE_NAME, type AuditJobPayload } from './types';

function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL or UPSTASH_REDIS_REST_URL is required to initialize the queue client.');
  }

  return redisUrl;
}

export function createRedisConnection() {
  return new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
}

export function createAuditQueue(connection = createRedisConnection()) {
  return new Queue<AuditJobPayload>(AUDIT_QUEUE_NAME, {
    connection,
  });
}
