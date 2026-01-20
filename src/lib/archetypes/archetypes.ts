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
