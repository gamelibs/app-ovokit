import { promises as fs } from "node:fs";
import path from "node:path";
import { redis } from "@/lib/redis";

const VIEWS_FILE = path.join(process.cwd(), "data", "plays-views.json");
const REDIS_STATS_PREFIX = "ovoforge:stats";

type ViewsMap = Record<string, { views: number; likes: number }>;

async function readViewsMap(): Promise<ViewsMap> {
  try {
    const raw = await fs.readFile(VIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ViewsMap;
    }
  } catch {
    // file not found or invalid
  }
  return {};
}

async function writeViewsMap(map: ViewsMap): Promise<void> {
  await fs.mkdir(path.dirname(VIEWS_FILE), { recursive: true });
  const tmpFile = `${VIEWS_FILE}.tmp.${Date.now()}`;
  await fs.writeFile(tmpFile, JSON.stringify(map, null, 2) + "\n", "utf8");
  await fs.rename(tmpFile, VIEWS_FILE);
}

function statsKey(slug: string): string {
  return `${REDIS_STATS_PREFIX}:${slug}`;
}

function normalizeStats(data: { views?: number | string; likes?: number | string } | null): {
  views: number;
  likes: number;
} {
  return {
    views: Number(data?.views ?? 0),
    likes: Number(data?.likes ?? 0),
  };
}

export async function getPlayStats(slug: string): Promise<{ views: number; likes: number }> {
  if (redis) {
    const data = await redis.hgetall(statsKey(slug));
    return normalizeStats(data);
  }

  const map = await readViewsMap();
  return map[slug] ?? { views: 0, likes: 0 };
}

export async function incrementViews(slug: string): Promise<{ views: number; likes: number }> {
  if (redis) {
    const views = await redis.hincrby(statsKey(slug), "views", 1);
    const data = await redis.hgetall(statsKey(slug));
    return normalizeStats({ ...data, views });
  }

  const map = await readViewsMap();
  const current = map[slug] ?? { views: 0, likes: 0 };
  const updated = { ...current, views: current.views + 1 };
  map[slug] = updated;
  await writeViewsMap(map);
  return updated;
}

export async function incrementLikes(slug: string): Promise<{ views: number; likes: number }> {
  if (redis) {
    const likes = await redis.hincrby(statsKey(slug), "likes", 1);
    const data = await redis.hgetall(statsKey(slug));
    return normalizeStats({ ...data, likes });
  }

  const map = await readViewsMap();
  const current = map[slug] ?? { views: 0, likes: 0 };
  const updated = { ...current, likes: current.likes + 1 };
  map[slug] = updated;
  await writeViewsMap(map);
  return updated;
}

export async function deletePlayStats(slug: string): Promise<void> {
  if (redis) {
    await redis.del(statsKey(slug));
    return;
  }

  const map = await readViewsMap();
  if (slug in map) {
    delete map[slug];
    await writeViewsMap(map);
  }
}

/**
 * 将本地文件系统中的统计数据一次性导入 Redis。
 * 用于从旧版本迁移到 Redis 的场景。
 */
export async function migrateFileStatsToRedis(): Promise<number> {
  if (!redis) {
    throw new Error("Redis is not configured");
  }

  const map = await readViewsMap();
  let count = 0;

  for (const [slug, stats] of Object.entries(map)) {
    await redis.hset(statsKey(slug), {
      views: stats.views,
      likes: stats.likes,
    });
    count++;
  }

  return count;
}
