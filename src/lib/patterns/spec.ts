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

/** 内容语言目录：zh-CN → content/patterns，其余语言 → content/patterns-{locale}（缺失按 自有→en→zh 链回退） */
function patternsRootDir(locale: string = "zh-CN") {
  return path.join(process.cwd(), "content", locale === "zh-CN" ? "patterns" : `patterns-${locale}`);
}

function localeCandidates(locale: string): string[] {
  if (locale === "zh-CN") return ["zh-CN"];
  if (locale === "en") return ["en", "zh-CN"];
  return [locale, "en", "zh-CN"];
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
  for (const candidate of localeCandidates(locale)) {
    const spec = await readSpecFromDir(patternsRootDir(candidate), key);
    if (spec) {
      spec.untranslated = candidate !== locale;
      return spec;
    }
  }
  return null;
}

export async function listPatternSpecs(locale: string = "zh-CN"): Promise<CorePatternSpec[]> {
  const entries = await Promise.all(corePatternKeys.map((key) => readPatternSpec(key, locale)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
