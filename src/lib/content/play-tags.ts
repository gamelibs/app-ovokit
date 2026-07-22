import taxonomy from "@/lib/taxonomy/taxonomy.json";

/**
 * 站点统一标签词表（唯一真相源 = ovo-taxonomy 协议，由 scripts/sync-taxonomy.mjs 同步）。
 *
 * 分层：
 * - 行为母型标签：14 个（archetype 中文名）
 * - 玩法特征标签：8 个（feature 中文名）
 * - 运营标记：推荐 / 热门（仅运营用，不属于玩法分类）
 *
 * 旧标签（废弃）通过 LEGACY_TAG_MAP 在显示层自动映射为新名，不动 meta.json 原数据。
 */

type TaxonomyDoc = {
  archetypes: { key: string; name: string }[];
  features: { key: string; name: string }[];
};

const doc = taxonomy as unknown as TaxonomyDoc;

/** 行为母型标签（14） */
export const TAG_ARCHETYPES: string[] = doc.archetypes.map((a) => a.name);

/** 玩法特征标签（8） */
export const TAG_FEATURES: string[] = doc.features.map((f) => f.name);

/** 运营标记（非玩法分类，单独分组） */
export const TAG_OPS = ["推荐", "热门"] as const;

/** 全部可选标签（行为母型 + 玩法特征 + 运营标记） */
export const availablePlayTags = [...TAG_ARCHETYPES, ...TAG_FEATURES, ...TAG_OPS] as const;

/** 兼容旧类型（历史上是 const 联合类型；现在放宽为 string，词表由上方常量约束） */
export type PlayTag = string;

/**
 * 旧标签 → 新标签映射（显示层使用，不改原数据）。
 * 依据：taxonomy/mappings/site-tags.v1.json 的消歧规则。
 */
export const LEGACY_TAG_MAP: Record<string, string> = {
  战斗: "战斗对抗",
  放置: "放置产出",
  "放置 / 建造": "建造布局",
  塔防: "建造布局", // 塔防 = 建造+战斗组合，主标签归建造布局
  数值: "数值成长",
  行进跑酷: "行进 / 跑酷",
  时机反应: "时机 / 反应",
  成长数值: "成长 / 数值",
};

/**
 * 废弃标签（显示层直接隐藏，不动原数据）：
 * - 动作：pattern 层概念，已由 meta.pattern 表达，不应再做玩法标签
 * - 状态机 / 生成：工程实现概念，不属于玩法标签
 */
export const LEGACY_DROP_TAGS = ["动作", "状态机", "生成"];

/** 显示用规范化：旧标签 → 新名；未收录的标签原样返回（兼容历史数据） */
export function normalizeTag(tag: string): string {
  return LEGACY_TAG_MAP[tag] ?? tag;
}

/** 规范化一组标签：映射 + 隐藏废弃标签 + 去重（保持顺序） */
export function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    if (LEGACY_DROP_TAGS.includes(t)) continue;
    const n = normalizeTag(t);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

/** 是否运营标记（用于展示层区分玩法标签与运营标签） */
export function isOpsTag(tag: string): boolean {
  return (TAG_OPS as readonly string[]).includes(tag);
}

/** 表单可选标签分组（分组全量可选） */
export const TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: "行为母型", tags: TAG_ARCHETYPES },
  { label: "玩法特征", tags: TAG_FEATURES },
  { label: "运营标记", tags: [...TAG_OPS] },
];
