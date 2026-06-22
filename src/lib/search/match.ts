import type { PlayMeta, PlaySearchDoc } from "@/lib/content/plays";

export type SearchResult = {
  slug: string;
  title: string;
  subtitle: string;
  score: number;
};

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,，]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function countMatches(text: string, tokens: string[]): number {
  const lower = text.toLowerCase();
  return tokens.reduce((count, token) => (lower.includes(token) ? count + 1 : count), 0);
}

/**
 * 在 plays 搜索文档中匹配查询词。
 * - 至少命中一个 token 才返回。
 * - 命中 token 越多，排名越靠前。
 * - 标题命中的结果额外加权。
 */
export function searchPlayDocs(docs: PlaySearchDoc[], query: string): SearchResult[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const scored = docs
    .map((doc) => {
      const textMatches = countMatches(doc.text, tokens);
      const titleMatches = countMatches(doc.title, tokens);
      const subtitleMatches = countMatches(doc.subtitle, tokens);
      if (textMatches === 0 && titleMatches === 0 && subtitleMatches === 0) return null;

      const score = textMatches + titleMatches * 3 + subtitleMatches * 2;
      return { slug: doc.slug, title: doc.title, subtitle: doc.subtitle, score };
    })
    .filter((r): r is SearchResult => r !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * 根据搜索结果的 slug 顺序，对完整的 PlayMeta 列表进行排序/过滤。
 * 保留未命中的 plays 排到最后（当用于与分类筛选叠加时，先过滤再排序）。
 */
export function sortPlaysBySearchResults(
  plays: PlayMeta[],
  results: SearchResult[],
): PlayMeta[] {
  const order = new Map(results.map((r, i) => [r.slug, i]));
  return [...plays].sort((a, b) => {
    const ia = order.get(a.slug);
    const ib = order.get(b.slug);
    if (ia === undefined && ib === undefined) return 0;
    if (ia === undefined) return 1;
    if (ib === undefined) return -1;
    return ia - ib;
  });
}

export function filterPlaysBySearchResults(plays: PlayMeta[], results: SearchResult[]): PlayMeta[] {
  const matched = new Set(results.map((r) => r.slug));
  return plays.filter((p) => matched.has(p.slug));
}

export const POPULAR_SEARCH_TERMS = [
  "三消",
  "消除",
  "跑酷",
  "射击",
  "Roguelike",
  "塔防",
  "放置",
  "合成",
  "关卡",
  "数值",
  "解谜",
  "战斗",
  "状态机",
  "物理",
];
