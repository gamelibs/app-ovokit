import { promises as fs } from "node:fs";
import path from "node:path";
import {
  corePatternKeys,
  type CorePatternKey,
  type CorePatternMeta,
} from "./patterns";

export type CorePatternSpec = CorePatternMeta & {
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 内容语言目录：zh-CN → content/patterns，en → content/patterns-en（缺失时回退中文） */
function patternsRootDir(locale: string = "zh-CN") {
  return path.join(process.cwd(), "content", locale === "en" ? "patterns-en" : "patterns");
}

async function readSpecFromDir(rootDir: string, key: CorePatternKey): Promise<CorePatternSpec | null> {
  try {
    const metaPath = path.join(rootDir, key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as CorePatternSpec;
  } catch {
    return null;
  }
}

export async function readPatternSpec(
  key: CorePatternKey,
  locale: string = "zh-CN",
): Promise<CorePatternSpec | null> {
  if (locale === "en") {
    const enSpec = await readSpecFromDir(patternsRootDir("en"), key);
    if (enSpec) return enSpec;
    const zhSpec = await readSpecFromDir(patternsRootDir("zh-CN"), key);
    if (zhSpec) zhSpec.untranslated = true;
    return zhSpec;
  }
  return readSpecFromDir(patternsRootDir("zh-CN"), key);
}

export async function listPatternSpecs(locale: string = "zh-CN"): Promise<CorePatternSpec[]> {
  const entries = await Promise.all(corePatternKeys.map((key) => readPatternSpec(key, locale)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
