import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { getPatternsForArchetype, isPlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { inferArchetypeFromTags } from "@/lib/archetypes/tag-map";
import { readArchetypeSpec, type ArchetypeDemoLabCard } from "@/lib/archetypes/spec";
import { listPlays } from "@/lib/content/plays";

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
  /** 归属本母型的案例文章（显式 meta.archetype 优先，tag 推断兜底） */
  relatedPlays: ArchetypeRelatedPlay[];
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
  const [spec, plays] = await Promise.all([
    readArchetypeSpec(key, locale),
    listPlays(locale === "en" ? "en" : "zh-CN"),
  ]);
  const relatedPlays: ArchetypeRelatedPlay[] = plays
    .filter((p) => resolvePlayArchetype(p) === key)
    .map((p) => ({ slug: p.slug, title: p.title, subtitle: p.subtitle }));
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
      patternKeys: getPatternsForArchetype(key),
      relatedPlays,
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
    patternKeys: getPatternsForArchetype(key),
    relatedPlays,
    untranslated: spec.untranslated,
  };
}
