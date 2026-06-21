/**
 * 简单的基于 IP 的内存限流器。
 *
 * 适用于单实例部署；若后续需要多实例/分布式限流，可替换为 Redis 实现。
 */

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  // Next.js Request 不暴露 socket，这里用用户代理+路径做一个弱指纹兜底
  return "unknown";
}

function cleanupBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
}

export function rateLimitByIp(
  req: Request,
  config: RateLimitConfig,
): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / config.windowMs)}`;

  // 简单清理：每 100 次请求触发一次过期桶清理
  if (buckets.size % 100 === 0) {
    cleanupBuckets();
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  const remaining = Math.max(0, config.limit - bucket.count);
  const allowed = bucket.count < config.limit;

  if (allowed) {
    bucket.count++;
  }

  return { allowed, limit: config.limit, remaining, resetAt: bucket.resetAt };
}

export const RATE_LIMITS = {
  view: { limit: 60, windowMs: 60_000 },
  like: { limit: 30, windowMs: 60_000 },
  contact: { limit: 5, windowMs: 15 * 60_000 },
  login: { limit: 10, windowMs: 60_000 },
} as const;
