import { promises as fs } from "node:fs";
import path from "node:path";
import {
  implementationTraitKeys,
  type ImplementationTraitKey,
  type ImplementationTraitMeta,
} from "./implementation-traits";

export type ImplementationTraitSpec = ImplementationTraitMeta & {
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 内容语言目录：zh-CN → content/implementation-traits，其余语言 → content/implementation-traits-{locale}（缺失按 自有→en→zh 链回退） */
function implementationTraitsRootDir(locale: string = "zh-CN") {
  return path.join(
    process.cwd(),
    "content",
    locale === "zh-CN" ? "implementation-traits" : `implementation-traits-${locale}`,
  );
}

function localeCandidates(locale: string): string[] {
  if (locale === "zh-CN") return ["zh-CN"];
  if (locale === "en") return ["en", "zh-CN"];
  return [locale, "en", "zh-CN"];
}

async function readSpecFromDir(
  rootDir: string,
  key: ImplementationTraitKey,
): Promise<ImplementationTraitSpec | null> {
  try {
    const metaPath = path.join(rootDir, key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as ImplementationTraitSpec;
  } catch {
    return null;
  }
}

export async function readImplementationTraitSpec(
  key: ImplementationTraitKey,
  locale: string = "zh-CN",
): Promise<ImplementationTraitSpec | null> {
  for (const candidate of localeCandidates(locale)) {
    const spec = await readSpecFromDir(implementationTraitsRootDir(candidate), key);
    if (spec) {
      spec.untranslated = candidate !== locale;
      return spec;
    }
  }
  return null;
}

export async function listImplementationTraitSpecs(
  locale: string = "zh-CN",
): Promise<ImplementationTraitSpec[]> {
  const entries = await Promise.all(
    implementationTraitKeys.map((key) => readImplementationTraitSpec(key, locale)),
  );
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
