import { promises as fs } from "node:fs";
import path from "node:path";
import { playArchetypeKeys, type PlayArchetypeKey } from "@/lib/archetypes/archetypes";

export type ArchetypeComboCardSpec = {
  formula: string;
  effect: string;
  href?: string;
};

/** demo 实验指导卡：把试玩 demo 变成「带着问题做实验」 */
export type ArchetypeDemoLabCard = {
  /** 实验名（如「连锁倍率实验」） */
  title: string;
  /** 操作：让读者做什么（如「把倍率从 1x 拉到 3x」） */
  action: string;
  /** 观察点：应该注意到什么、背后的设计原理 */
  observe: string;
};

export type ArchetypeIntro = {
  /** 这是什么（一句话定义 + 知名案例） */
  what: string;
  /** 玩起来（操作与核心反馈） */
  feel: string;
  /** 为什么值得了解（设计价值） */
  why: string;
};

export type ArchetypeSpec = {
  key: PlayArchetypeKey;
  name: string;
  nameEn: string;
  subtitle: string;
  features: string[];
  difficulty: string;
  demoRuleHint: string;
  /** demo 实验指导（可选）：挂在试玩区右栏，指导读者用 demo 参数做对照实验 */
  demoLab?: ArchetypeDemoLabCard[];
  problemsSolved: string[];
  learningGoals: string[];
  minimalRules: string[];
  systemLoopHint: string;
  combos: ArchetypeComboCardSpec[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
  /** 导语（快速认识三小段）；缺省不渲染 */
  intro?: ArchetypeIntro;
  /** 概念本质正文段（导语卡后渲染）；缺省不渲染 */
  concept?: string;
  /** 设计要点（系统拆解区底部块）；缺省不渲染 */
  designNotes?: string[];
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
