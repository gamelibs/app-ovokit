import { promises as fs } from "node:fs";
import path from "node:path";

export type PlayDifficulty = "入门" | "进阶" | "硬核";

export type PlayTag =
  | "推荐"
  | "消除"
  | "解谜"
  | "合成"
  | "放置"
  | "放置 / 建造"
  | "点击"
  | "动作"
  | "躲避"
  | "战斗"
  | "战斗对抗"
  | "塔防"
  | "物理"
  | "网格"
  | "关卡"
  | "数值"
  | "成长 / 数值"
  | "生成"
  | "策略决策"
  | "行进 / 跑酷"
  | "射击"
  | "模拟"
  | "时机 / 反应"
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
  filterDifficulty?: PlayDifficulty;
};

export type PlayBrowseGroupKey = "archetype" | "feature" | "difficulty";

export const playBrowseGroups: ReadonlyArray<{ key: PlayBrowseGroupKey; label: string }> = [
  { key: "archetype", label: "母型玩法" },
  { key: "feature", label: "玩法特征" },
  { key: "difficulty", label: "难度层级" },
];

const forYouCategory: PlayCategory = { key: "for-you", label: "推荐" };

const archetypeCategories: PlayCategory[] = [
  { key: "match-clear", label: "消除", filterTags: ["消除"] },
  { key: "dodge-avoid", label: "躲避", filterTags: ["躲避"] },
  { key: "runner", label: "行进 / 跑酷", filterTags: ["行进 / 跑酷", "动作"] },
  { key: "shoot-aim", label: "射击", filterTags: ["射击"] },
  { key: "combat", label: "战斗对抗", filterTags: ["战斗对抗", "战斗"] },
  { key: "placement", label: "放置 / 建造", filterTags: ["放置 / 建造", "放置"] },
  { key: "choice-strategy", label: "策略决策", filterTags: ["策略决策", "塔防", "状态机"] },
  { key: "physics", label: "物理", filterTags: ["物理"] },
  { key: "puzzle", label: "解谜", filterTags: ["解谜"] },
  { key: "progression", label: "成长 / 数值", filterTags: ["成长 / 数值", "数值"] },
  { key: "simulation", label: "模拟", filterTags: ["模拟"] },
  { key: "timing", label: "时机 / 反应", filterTags: ["时机 / 反应", "点击"] },
];

const featureCategories: PlayCategory[] = [
  { key: "merge", label: "合成", filterTags: ["合成"] },
  { key: "idle", label: "放置", filterTags: ["放置", "放置 / 建造"] },
  { key: "click", label: "点击", filterTags: ["点击", "时机 / 反应"] },
  { key: "grid", label: "网格", filterTags: ["网格"] },
  { key: "levels", label: "关卡", filterTags: ["关卡"] },
  { key: "numbers", label: "数值", filterTags: ["数值", "成长 / 数值"] },
  { key: "generation", label: "生成", filterTags: ["生成"] },
  { key: "roguelike", label: "Roguelike", filterTags: ["Roguelike"] },
  { key: "state-machine", label: "状态机", filterTags: ["状态机"] },
];

const difficultyCategories: PlayCategory[] = [
  { key: "beginner", label: "入门", filterDifficulty: "入门" },
  { key: "advanced", label: "进阶", filterDifficulty: "进阶" },
  { key: "hardcore", label: "硬核", filterDifficulty: "硬核" },
];

const categoriesByGroup: Record<PlayBrowseGroupKey, PlayCategory[]> = {
  archetype: archetypeCategories,
  feature: featureCategories,
  difficulty: difficultyCategories,
};

export function isPlayBrowseGroupKey(v: string | undefined): v is PlayBrowseGroupKey {
  return v === "archetype" || v === "feature" || v === "difficulty";
}

export function getPlayCategoriesForGroup(group: PlayBrowseGroupKey): PlayCategory[] {
  return [forYouCategory, ...categoriesByGroup[group]];
}

export function getPlayCategory(group: PlayBrowseGroupKey, key: string): PlayCategory | null {
  if (key === forYouCategory.key) return forYouCategory;
  return categoriesByGroup[group].find((c) => c.key === key) ?? null;
}

const legacyCatKeyMap: Record<string, { group: PlayBrowseGroupKey; cat: string }> = {
  "for-you": { group: "archetype", cat: "for-you" },
  eliminate: { group: "archetype", cat: "match-clear" },
  merge: { group: "feature", cat: "merge" },
  idle: { group: "archetype", cat: "placement" },
  click: { group: "feature", cat: "click" },
  puzzle: { group: "archetype", cat: "puzzle" },
  action: { group: "archetype", cat: "runner" },
  defense: { group: "archetype", cat: "choice-strategy" },
  combat: { group: "archetype", cat: "combat" },
};

export function resolvePlayBrowseState({
  group,
  cat,
}: {
  group?: string;
  cat?: string;
}): { group: PlayBrowseGroupKey; cat: string } {
  const catKey = cat ?? "for-you";

  if (!isPlayBrowseGroupKey(group)) {
    const legacy = legacyCatKeyMap[catKey];
    if (legacy) return legacy;
    return { group: "archetype", cat: catKey };
  }

  if (catKey === "for-you") return { group, cat: catKey };
  const inGroup = getPlayCategory(group, catKey);
  if (inGroup) return { group, cat: catKey };

  const fallback = Object.entries(categoriesByGroup).find(([, list]) =>
    list.some((c) => c.key === catKey),
  )?.[0] as PlayBrowseGroupKey | undefined;

  return { group: fallback ?? group, cat: fallback ? catKey : "for-you" };
}

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
