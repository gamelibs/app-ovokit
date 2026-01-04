import { promises as fs } from "node:fs";
import path from "node:path";

export type PlayDifficulty = "入门" | "进阶" | "硬核";

export type PlayTag =
  | "推荐"
  | "移动与空间"
  | "交互与碰撞"
  | "战斗"
  | "战斗与对抗"
  | "合成"
  | "放置"
  | "Roguelike"
  | "塔防"
  | "数值与成长"
  | "规则与状态"
  | "状态机"
  | "随机与生成";

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

export const playCategories: { key: string; label: string }[] = [
  { key: "for-you", label: "推荐" },
  { key: "movement", label: "移动与空间" },
  { key: "interaction", label: "交互与碰撞" },
  { key: "combat", label: "战斗与对抗" },
  { key: "numbers", label: "数值与成长" },
  { key: "rules", label: "规则与状态" },
  { key: "random", label: "随机与生成" },
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

