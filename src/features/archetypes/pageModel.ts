import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { getPatternsForArchetype, isPlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { inferArchetypeFromTags } from "@/lib/archetypes/tag-map";
import { readArchetypeSpec, type ArchetypeDemoLabCard, type ArchetypeIntro, type ArchetypeValueNotes } from "@/lib/archetypes/spec";
import { listPlays, type ContentLocale } from "@/lib/content/plays";
import { listFeatureSpecs } from "@/lib/features/spec";
import { featureKeyByName, type FeatureKey } from "@/lib/features/features";
import { listPatternSpecs } from "@/lib/patterns/spec";
import { isCorePatternKey } from "@/lib/patterns/patterns";

export type ArchetypeComboCard = {
  formula: string;
  effect: string;
  href?: string;
};

/** cluster 案例条目（pillar → cluster 反向回链） */
export type ArchetypeRelatedPlay = {
  slug: string;
  title: string;
  subtitle?: string;
};

export type ArchetypePageModel = {
  key: PlayArchetypeKey;
  name: string;
  nameEn: string;
  title: string;
  subtitle: string;
  features: string[];
  difficulty: string;
  problemsSolved: string[];
  learningGoals: string[];
  demoRuleHint: string;
  demoLab: ArchetypeDemoLabCard[];
  minimalRules: string[];
  systemLoopHint: string;
  combos: ArchetypeComboCard[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
  patternKeys: string[];
  /**
   * 玩法特征 chips（数据锁定）：name 取当前 locale 特征 spec 的 name；
   * key 为 null 表示该名称不在特征词表内（不可链接，按纯文本渲染）。
   */
  featureRefs: { key: FeatureKey | null; name: string }[];
  /** 所属核心循环 chips（数据锁定）：name/nameEn 取当前 locale 核心循环 spec */
  patternRefs: { key: string; name: string; nameEn: string }[];
  /** 归属本母型的案例文章（显式 meta.archetype 优先，tag 推断兜底） */
  relatedPlays: ArchetypeRelatedPlay[];
  /** 导语（快速认识三小段）；缺省 null 不渲染 */
  intro: ArchetypeIntro | null;
  /** 概念本质正文段；缺省空串不渲染 */
  concept: string;
  /** 设计要点；缺省空数组不渲染 */
  designNotes: string[];
  /** 玩法价值三维；缺省 null 不渲染 */
  value: ArchetypeValueNotes | null;
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 解析案例的母型归属：显式 meta.archetype（ContentPack v1.1 生产线写入）优先，tag 推断兜底 */
function resolvePlayArchetype(play: { archetype?: string; tags: string[] }): PlayArchetypeKey | null {
  if (play.archetype && isPlayArchetypeKey(play.archetype)) return play.archetype;
  return inferArchetypeFromTags(play.tags);
}

export async function getArchetypePageModel(
  key: PlayArchetypeKey,
  locale: string = "zh-CN",
): Promise<ArchetypePageModel> {
  const [spec, plays, featureSpecs, patternSpecs] = await Promise.all([
    readArchetypeSpec(key, locale),
    listPlays(locale as ContentLocale),
    listFeatureSpecs(locale),
    listPatternSpecs(locale),
  ]);
  const relatedPlays: ArchetypeRelatedPlay[] = plays
    .filter((p) => resolvePlayArchetype(p) === key)
    .map((p) => ({ slug: p.slug, title: p.title, subtitle: p.subtitle }));
  const patternKeys = getPatternsForArchetype(key);
  const featureNameByKey = new Map(featureSpecs.map((s) => [s.key, s.name]));
  const resolveFeatureRefs = (names: string[]) =>
    names.map((name) => {
      const featureKey = featureKeyByName[name] ?? null;
      // 特征 spec 的 name 已按 locale 本地化（loader 回退链）；查不到 spec 用原名兜底
      return { key: featureKey, name: (featureKey && featureNameByKey.get(featureKey)) || name };
    });
  const patternNameByKey = new Map(patternSpecs.map((s) => [s.key, s]));
  const patternRefs = patternKeys.map((k) => {
    const s = isCorePatternKey(k) ? patternNameByKey.get(k) : undefined;
    return { key: k, name: s?.name ?? k, nameEn: s?.nameEn ?? k };
  });
  if (!spec) {
    return {
      key,
      name: key,
      nameEn: key,
      title: key,
      subtitle: "",
      features: [],
      difficulty: "",
      problemsSolved: [],
      learningGoals: [],
      demoRuleHint: "",
      demoLab: [],
      minimalRules: [],
      systemLoopHint: "",
      combos: [],
      advancedWarnings: [],
      advancedAlgoRefs: [],
      patternKeys,
      featureRefs: [],
      patternRefs,
      relatedPlays,
      intro: null,
      concept: "",
      designNotes: [],
      value: null,
    };
  }
  return {
    key,
    name: spec.name,
    nameEn: spec.nameEn,
    // 英文内容下 name 已是英文，避免「English（English）」重复展示
    title: spec.name === spec.nameEn ? spec.name : `${spec.name}（${spec.nameEn}）`,
    subtitle: spec.subtitle,
    features: spec.features,
    difficulty: spec.difficulty,
    problemsSolved: spec.problemsSolved,
    learningGoals: spec.learningGoals,
    demoRuleHint: spec.demoRuleHint,
    demoLab: spec.demoLab ?? [],
    minimalRules: spec.minimalRules,
    systemLoopHint: spec.systemLoopHint,
    combos: spec.combos,
    advancedWarnings: spec.advancedWarnings,
    advancedAlgoRefs: spec.advancedAlgoRefs,
    patternKeys,
    featureRefs: resolveFeatureRefs(spec.features),
    patternRefs,
    relatedPlays,
    intro: spec.intro ?? null,
    concept: spec.concept ?? "",
    designNotes: spec.designNotes ?? [],
    value: spec.value ?? null,
    untranslated: spec.untranslated,
  };
}
