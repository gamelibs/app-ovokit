import { Redis } from "@upstash/redis";

/**
 * Upstash Redis 客户端。
 *
 * - 生产/线上环境配置 UPSTASH_REDIS_REST_URL 与 UPSTASH_REDIS_REST_TOKEN。
 * - 本地开发若未配置，返回 null，相关功能回退到文件系统或其他本地实现。
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export function isRedisEnabled(): boolean {
  return redis !== null;
}
