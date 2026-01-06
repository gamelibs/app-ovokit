import { promises as fs } from "node:fs";
import path from "node:path";

export type PlayDifficulty = "入门" | "进阶" | "硬核";

export type PlayTag =
  | "推荐"
  | "消除"
  | "解谜"
  | "合成"
  | "放置"
  | "点击"
  | "动作"
  | "躲避"
  | "战斗"
  | "塔防"
  | "物理"
  | "网格"
  | "关卡"
  | "数值"
  | "生成"
  | "Roguelike"
  | "状态机"
  ;

export type PlayCodeSnippet = {
  title: string;
  language: "ts" | "tsx" | "js" | "glsl" | "json" | "mdx";
  code: string;
};

export type PlayDemo = {
  iframeSrc?: string;
  videoSrc?: string;
  note?: string;
};

export type PlayCover = {
  src: string;
  alt?: string;
};

export type PlayBreakdownSection = {
  title: string;
  bullets: string[];
};

export type PlayMeta = {
  slug: string;
  title: string;
  subtitle: string;
  cover?: PlayCover;
  coverWide?: PlayCover;
  tags: PlayTag[];
  difficulty: PlayDifficulty;
  techStack: string[];
  corePoints: string[];
  stats: {
    views: number;
    likes: number;
  };
  breakdown: PlayBreakdownSection[];
  codeSnippets: PlayCodeSnippet[];
  demo: PlayDemo;
};

export type Play = PlayMeta & {
  articleMdx?: string;
};

export type PlayCategory = {
  key: string;
  label: string;
  filterTags?: PlayTag[];
};

export const playCategories: PlayCategory[] = [
  { key: "for-you", label: "推荐" },
  { key: "eliminate", label: "消除", filterTags: ["消除"] },
  { key: "merge", label: "合成", filterTags: ["合成"] },
  { key: "idle", label: "放置", filterTags: ["放置"] },
  { key: "click", label: "点击", filterTags: ["点击"] },
  { key: "puzzle", label: "解谜", filterTags: ["解谜"] },
  { key: "action", label: "动作", filterTags: ["动作", "躲避"] },
  { key: "defense", label: "塔防", filterTags: ["塔防"] },
  { key: "combat", label: "战斗", filterTags: ["战斗"] },
];

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

function playDir(slug: string) {
  return path.join(playsRootDir(), slug);
}

export async function listPlaySlugs(): Promise<string[]> {
  const dir = playsRootDir();
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export async function readPlayMeta(slug: string): Promise<PlayMeta | null> {
  try {
    const metaPath = path.join(playDir(slug), "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as PlayMeta;
  } catch {
    return null;
  }
}

export async function readPlayArticleMdx(slug: string): Promise<string | null> {
  try {
    const articlePath = path.join(playDir(slug), "article.mdx");
    return await fs.readFile(articlePath, "utf8");
  } catch {
    return null;
  }
}

export async function listPlays(): Promise<PlayMeta[]> {
  const slugs = await listPlaySlugs();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await readPlayMeta(slug);
      if (!meta) return null;
      const metaPath = path.join(playDir(slug), "meta.json");
      const stat = await fs.stat(metaPath).catch(() => null);
      return { meta, mtimeMs: stat?.mtimeMs ?? 0 };
    }),
  );

  return entries
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((e) => e.meta);
}

export async function getPlayBySlug(slug: string): Promise<Play | null> {
  const meta = await readPlayMeta(slug);
  if (!meta) return null;
  const articleMdx = await readPlayArticleMdx(slug);
  return { ...meta, articleMdx: articleMdx ?? undefined };
}
