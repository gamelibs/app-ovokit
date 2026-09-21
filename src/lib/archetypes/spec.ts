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
  problemsSolved: string[];
  learningGoals: string[];
  minimalRules: string[];
  systemLoopHint: string;
  combos: ArchetypeComboCardSpec[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 内容语言目录：zh-CN → content/archetypes，en → content/archetypes-en（缺失时回退中文） */
function archetypesRootDir(locale: string = "zh-CN") {
  return path.join(process.cwd(), "content", locale === "en" ? "archetypes-en" : "archetypes");
}

async function readSpecFromDir(rootDir: string, key: PlayArchetypeKey): Promise<ArchetypeSpec | null> {
  try {
    const metaPath = path.join(rootDir, key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as ArchetypeSpec;
  } catch {
    return null;
  }
}

export async function readArchetypeSpec(
  key: PlayArchetypeKey,
  locale: string = "zh-CN",
): Promise<ArchetypeSpec | null> {
  if (locale === "en") {
    const enSpec = await readSpecFromDir(archetypesRootDir("en"), key);
    if (enSpec) return enSpec;
    const zhSpec = await readSpecFromDir(archetypesRootDir("zh-CN"), key);
    if (zhSpec) zhSpec.untranslated = true;
    return zhSpec;
  }
  return readSpecFromDir(archetypesRootDir("zh-CN"), key);
}

export async function listArchetypeSpecs(locale: string = "zh-CN"): Promise<ArchetypeSpec[]> {
  const entries = await Promise.all(playArchetypeKeys.map((key) => readArchetypeSpec(key, locale)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
