import { promises as fs } from "node:fs";
import path from "node:path";

const VIEWS_FILE = path.join(process.cwd(), "data", "plays-views.json");

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

export async function getPlayStats(slug: string): Promise<{ views: number; likes: number }> {
  const map = await readViewsMap();
  return map[slug] ?? { views: 0, likes: 0 };
}

export async function incrementViews(slug: string): Promise<{ views: number; likes: number }> {
  const map = await readViewsMap();
  const current = map[slug] ?? { views: 0, likes: 0 };
  const updated = { ...current, views: current.views + 1 };
  map[slug] = updated;
  await writeViewsMap(map);
  return updated;
}

export async function incrementLikes(slug: string): Promise<{ views: number; likes: number }> {
  const map = await readViewsMap();
  const current = map[slug] ?? { views: 0, likes: 0 };
  const updated = { ...current, likes: current.likes + 1 };
  map[slug] = updated;
  await writeViewsMap(map);
  return updated;
}

export async function deletePlayStats(slug: string): Promise<void> {
  const map = await readViewsMap();
  if (slug in map) {
    delete map[slug];
    await writeViewsMap(map);
  }
}
