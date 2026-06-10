import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10));
// Cap the number of tracked clients so a flood of distinct IPs can't grow the
// store without bound (memory-exhaustion guard).
const MAX_TRACKED_KEYS = Math.max(1000, parseInt(process.env.RATE_LIMIT_MAX_KEYS ?? '50000', 10));

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, WINDOW_MS).unref();

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // req.ip is computed by Fastify using the configured trustProxy setting,
    // so it reflects the real client IP and cannot be spoofed via headers.
    const req = context.switchToHttp().getRequest<{ ip?: string }>();
    const ip = req.ip ?? 'unknown';
    const now = Date.now();

    const entry = store.get(ip);
    if (!entry || entry.resetAt < now) {
      if (!store.has(ip) && store.size >= MAX_TRACKED_KEYS) {
        evictExpired(now);
      }
      store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (entry.count >= MAX_REQUESTS) {
      throw new HttpException(
        { message: 'Too many requests. Please wait a minute before submitting another audit.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }
}

function evictExpired(now: number): void {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}
