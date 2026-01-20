import { promises as fs } from "node:fs";
import path from "node:path";
import { playArchetypeKeys, type PlayArchetypeKey } from "@/lib/archetypes/archetypes";

export type ArchetypeComboCardSpec = {
  formula: string;
  effect: string;
  href?: string;
};

export type ArchetypeSpec = {
  key: PlayArchetypeKey;
  name: string;
  nameEn: string;
  subtitle: string;
  features: string[];
  difficulty: string;
  demoRuleHint: string;
  learningGoals: string[];
  minimalRules: string[];
  systemLoopHint: string;
  combos: ArchetypeComboCardSpec[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
};

function archetypesRootDir() {
  return path.join(process.cwd(), "content", "archetypes");
}

export async function readArchetypeSpec(key: PlayArchetypeKey): Promise<ArchetypeSpec | null> {
  try {
    const metaPath = path.join(archetypesRootDir(), key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as ArchetypeSpec;
  } catch {
    return null;
  }
}

export async function listArchetypeSpecs(): Promise<ArchetypeSpec[]> {
  const entries = await Promise.all(playArchetypeKeys.map((key) => readArchetypeSpec(key)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}

