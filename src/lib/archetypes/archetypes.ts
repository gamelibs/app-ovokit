import type { CorePatternKey } from "@/lib/patterns/patterns";

export const playArchetypeKeys = [
  "match-clear",
  "dodge-avoid",
  "runner",
  "shoot-aim",
  "combat",
  "placement",
  "choice-strategy",
  "physics",
  "puzzle",
  "progression",
  "simulation",
  "timing",
] as const;

export type PlayArchetypeKey = (typeof playArchetypeKeys)[number];

export function isPlayArchetypeKey(v: string): v is PlayArchetypeKey {
  return (playArchetypeKeys as readonly string[]).includes(v);
}

/**
 * 母型玩法 → 核心编辑器原型的映射。
 * 表示一个母型在实现层面通常依赖哪些核心循环/数据结构。
 */
export const archetypeToPatterns: Record<PlayArchetypeKey, CorePatternKey[]> = {
  "match-clear": ["spatial"],
  "dodge-avoid": ["action"],
  runner: ["action"],
  "shoot-aim": ["action"],
  combat: ["action", "strategy"],
  placement: ["management"],
  "choice-strategy": ["strategy"],
  physics: ["spatial", "action"],
  puzzle: ["spatial"],
  progression: ["merge", "strategy"],
  simulation: ["management"],
  timing: ["action"],
};

export function getPatternsForArchetype(key: PlayArchetypeKey): CorePatternKey[] {
  return archetypeToPatterns[key] ?? [];
}
