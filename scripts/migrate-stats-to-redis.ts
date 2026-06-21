#!/usr/bin/env tsx
/**
 * 一次性脚本：将 data/plays-views.json 中的统计数据迁移到 Redis。
 *
 * 用法：
 *   1. 在 .env.local 中配置 UPSTASH_REDIS_REST_URL 与 UPSTASH_REDIS_REST_TOKEN
 *   2. pnpm tsx scripts/migrate-stats-to-redis.ts
 */

import dotenv from "dotenv";
import { migrateFileStatsToRedis } from "@/lib/content/views";

dotenv.config({ path: ".env.local" });

async function main() {
  const count = await migrateFileStatsToRedis();
  console.log(`✅ 已迁移 ${count} 条玩法统计数据到 Redis`);
}

main().catch((err) => {
  console.error("❌ 迁移失败：", err instanceof Error ? err.message : err);
  process.exit(1);
});
