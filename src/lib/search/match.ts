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

/** 热门搜索词（zh-CN，中文常量；其它语言见 POPULAR_SEARCH_TERMS_BY_LOCALE） */
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

/**
 * 热门搜索词按语言锁定：术语与标签词表（play-tags.ts TAG_LABELS_I18N）一致，
 * 词选配合搜索索引的本地化别名（listPlaySearchIndex 注入），保证点了能搜到内容。
 */
export const POPULAR_SEARCH_TERMS_BY_LOCALE: Record<string, string[]> = {
  "zh-CN": POPULAR_SEARCH_TERMS,
  en: [
    "Match-3",
    "Match",
    "Runner",
    "Shooter",
    "Roguelike",
    "Tower Defense",
    "Idle",
    "Merge",
    "Levels",
    "Numbers",
  ],
  ja: [
    "マッチ3",
    "マッチ",
    "ランナー",
    "シューター",
    "ローグライク",
    "タワーディフェンス",
    "放置",
    "マージ",
    "レベル",
    "数値",
  ],
  ko: [
    "매치3",
    "매치",
    "러너",
    "슈팅",
    "로그라이크",
    "타워 디펜스",
    "방치",
    "합성",
    "스테이지",
    "수치",
  ],
  es: [
    "match-3",
    "combinar",
    "runner",
    "disparos",
    "roguelike",
    "tower defense",
    "idle",
    "fusión",
    "niveles",
    "números",
  ],
  pt: [
    "match-3",
    "combinar",
    "corrida",
    "tiro",
    "roguelike",
    "tower defense",
    "idle",
    "fusão",
    "fases",
    "números",
  ],
};

/** 当前 locale 的热门搜索词（未知 locale 回退中文） */
export function getPopularSearchTerms(locale: string): string[] {
  return POPULAR_SEARCH_TERMS_BY_LOCALE[locale] ?? POPULAR_SEARCH_TERMS;
}
