import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { readArchetypeSpec } from "@/lib/archetypes/spec";

export type ArchetypeComboCard = {
  formula: string;
  effect: string;
  href?: string;
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
  minimalRules: string[];
  systemLoopHint: string;
  combos: ArchetypeComboCard[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
};

export async function getArchetypePageModel(key: PlayArchetypeKey): Promise<ArchetypePageModel> {
  const spec = await readArchetypeSpec(key);
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
      minimalRules: [],
      systemLoopHint: "",
      combos: [],
      advancedWarnings: [],
      advancedAlgoRefs: [],
    };
  }
  return {
    key,
    name: spec.name,
    nameEn: spec.nameEn,
    title: `${spec.name}（${spec.nameEn}）`,
    subtitle: spec.subtitle,
    features: spec.features,
    difficulty: spec.difficulty,
    problemsSolved: spec.problemsSolved,
    learningGoals: spec.learningGoals,
    demoRuleHint: spec.demoRuleHint,
    minimalRules: spec.minimalRules,
    systemLoopHint: spec.systemLoopHint,
    combos: spec.combos,
    advancedWarnings: spec.advancedWarnings,
    advancedAlgoRefs: spec.advancedAlgoRefs,
  };
}
