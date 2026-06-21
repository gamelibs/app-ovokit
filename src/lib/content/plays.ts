import { promises as fs } from "node:fs";
import path from "node:path";
import { getPlayStats } from "./views";
import { availablePlayTags } from "./play-tags";
import type { PlayTag } from "./play-tags";
import { corePatternKeys, fallbackCorePatternByKey, isCorePatternKey, type CorePatternKey } from "@/lib/patterns/patterns";
import { featureKeys, fallbackFeatureByKey } from "@/lib/features/features";
import { listFeatureSpecs } from "@/lib/features/spec";

export type PlayDifficulty = "入门" | "进阶" | "硬核";
export { availablePlayTags };
export type { PlayTag };

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
  /**
   * 核心玩法原型（Core Gameplay Pattern）。
   * 从编辑器架构角度对玩法进行归纳，与 tags/archetype 形成互补。
   */
  pattern?: CorePatternKey;
  stats: {
    views: number;
    likes: number;
  };
  breakdown: PlayBreakdownSection[];
  codeSnippets: PlayCodeSnippet[];
  demo: PlayDemo;
  published?: boolean;
};

export type Play = PlayMeta & {
  articleMdx?: string;
};

const PLACEHOLDER_COVER_SRC = "/plays/_placeholders/cover.svg";
const PLACEHOLDER_COVER_WIDE_SRC = "/plays/_placeholders/cover-wide.svg";

async function findPublicPlayAsset(
  slug: string,
  baseName: "cover" | "cover-wide",
): Promise<{ url: string } | null> {
  const exts = ["webp", "png", "jpg", "jpeg", "svg"] as const;
  for (const ext of exts) {
    const rel = path.join("plays", slug, `${baseName}.${ext}`);
    const abs = path.join(process.cwd(), "public", rel);
    const ok = await fs
      .stat(abs)
      .then((s) => s.isFile())
      .catch(() => false);
    if (ok) return { url: `/${rel.replace(/\\/g, "/")}` };
  }
  return null;
}

function inferPatternFromTags(tags: PlayTag[]): CorePatternKey | undefined {
  const tagSet = new Set(tags);

  // Spatial: board/cell/rule/state change
  if (tagSet.has("消除") || tagSet.has("解谜") || tagSet.has("网格")) return "spatial";

  // Merge: resource/merge/level up/production
  if (tagSet.has("合成")) return "merge";

  // Action: input/avatar/physics/score
  if (
    tagSet.has("动作") ||
    tagSet.has("点击") ||
    tagSet.has("时机 / 反应") ||
    tagSet.has("躲避") ||
    tagSet.has("行进 / 跑酷") ||
    tagSet.has("射击") ||
    tagSet.has("物理")
  )
    return "action";

  // Management: building/production/economy/growth
  if (tagSet.has("放置 / 建造") || tagSet.has("模拟")) return "management";

  // Strategy: unit/stats/combat/reward
  if (
    tagSet.has("塔防") ||
    tagSet.has("策略决策") ||
    tagSet.has("Roguelike") ||
    tagSet.has("状态机") ||
    tagSet.has("战斗") ||
    tagSet.has("战斗对抗")
  )
    return "strategy";

  // Numeric tags are ambiguous: use co-occurring tags to disambiguate
  if (tagSet.has("数值") || tagSet.has("成长 / 数值")) {
    if (tagSet.has("合成") || tagSet.has("放置")) return "merge";
    if (
      tagSet.has("塔防") ||
      tagSet.has("策略决策") ||
      tagSet.has("Roguelike") ||
      tagSet.has("状态机") ||
      tagSet.has("战斗") ||
      tagSet.has("战斗对抗")
    )
      return "strategy";
    return "merge";
  }

  // Standalone "放置" leans toward management
  if (tagSet.has("放置")) return "management";

  return undefined;
}

async function hydratePlayMedia(meta: PlayMeta): Promise<PlayMeta> {
  const coverSrc = meta.cover?.src;
  const needsCover = !coverSrc || coverSrc === PLACEHOLDER_COVER_SRC;
  const needsWide =
    !meta.coverWide?.src || meta.coverWide?.src === PLACEHOLDER_COVER_WIDE_SRC;

  const out: PlayMeta = { ...meta };

  // Infer pattern from tags if not explicitly set (backward compatible)
  if (!out.pattern || !isCorePatternKey(out.pattern)) {
    const inferred = inferPatternFromTags(out.tags);
    if (inferred) out.pattern = inferred;
  }

  if (needsCover) {
    const found = await findPublicPlayAsset(meta.slug, "cover");
    if (found) {
      out.cover = { src: found.url, alt: meta.cover?.alt ?? meta.title };
    }
  }

  if (needsWide) {
    const found = await findPublicPlayAsset(meta.slug, "cover-wide");
    if (found) {
      out.coverWide = { src: found.url, alt: meta.coverWide?.alt ?? meta.title };
    }
  }

  return out;
}

export type PlayCategory = {
  key: string;
  label: string;
  filterTags?: PlayTag[];
  filterDifficulty?: PlayDifficulty;
  /**
   * 当 group === "pattern" 时使用，直接按 PlayMeta.pattern 过滤。
   */
  filterPattern?: CorePatternKey;
};

export type PlayBrowseGroupKey = "archetype" | "pattern" | "feature" | "difficulty";

export const playBrowseGroups: ReadonlyArray<{ key: PlayBrowseGroupKey; label: string }> = [
  { key: "archetype", label: "母型玩法" },
  { key: "pattern", label: "核心原型" },
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

const featureCategories: PlayCategory[] = featureKeys.map((key) => ({
  key,
  label: fallbackFeatureByKey[key].name,
  filterTags: fallbackFeatureByKey[key].filterTags as PlayTag[],
}));

const difficultyCategories: PlayCategory[] = [
  { key: "beginner", label: "入门", filterDifficulty: "入门" },
  { key: "advanced", label: "进阶", filterDifficulty: "进阶" },
  { key: "hardcore", label: "硬核", filterDifficulty: "硬核" },
];

const patternCategories: PlayCategory[] = corePatternKeys.map((key) => ({
  key,
  label: fallbackCorePatternByKey[key].name,
  filterPattern: key,
}));

const categoriesByGroup: Record<PlayBrowseGroupKey, PlayCategory[]> = {
  archetype: archetypeCategories,
  pattern: patternCategories,
  feature: featureCategories,
  difficulty: difficultyCategories,
};

export function isPlayBrowseGroupKey(v: string | undefined): v is PlayBrowseGroupKey {
  return v === "archetype" || v === "pattern" || v === "feature" || v === "difficulty";
}

export function getPlayCategoriesForGroup(group: PlayBrowseGroupKey): PlayCategory[] {
  return [forYouCategory, ...categoriesByGroup[group]];
}

export function getPlayCategory(group: PlayBrowseGroupKey, key: string): PlayCategory | null {
  if (key === forYouCategory.key) return forYouCategory;
  return categoriesByGroup[group].find((c) => c.key === key) ?? null;
}

export async function getPlayCategoriesForGroupAsync(
  group: PlayBrowseGroupKey,
): Promise<PlayCategory[]> {
  if (group === "feature") {
    const specs = await listFeatureSpecs();
    return [forYouCategory, ...specs.map((s) => ({ key: s.key, label: s.name, filterTags: s.filterTags as PlayTag[] }))];
  }
  return getPlayCategoriesForGroup(group);
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
    const meta = JSON.parse(raw) as PlayMeta;
    // Default to published for backward compatibility
    if (meta.published === undefined) meta.published = true;
    // Always use real-time stats from data/plays-views.json
    // Ignore any hardcoded stats in meta.json (they are fake/seeding data)
    meta.stats = await getPlayStats(slug);
    return await hydratePlayMedia(meta);
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
    .filter((e): e is NonNullable<typeof e> => e !== null && e.meta.published !== false)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((e) => e.meta);
}

export async function listPlaysWithMtime(): Promise<Array<{ meta: PlayMeta; mtimeMs: number }>> {
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
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

export async function getPlayBySlug(slug: string): Promise<Play | null> {
  const meta = await readPlayMeta(slug);
  if (!meta) return null;
  const articleMdx = await readPlayArticleMdx(slug);
  return { ...meta, articleMdx: articleMdx ?? undefined };
}
