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

/** 内容语言目录：zh-CN → content/implementation-traits，en → content/implementation-traits-en（缺失时回退中文） */
function implementationTraitsRootDir(locale: string = "zh-CN") {
  return path.join(
    process.cwd(),
    "content",
    locale === "en" ? "implementation-traits-en" : "implementation-traits",
  );
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
  if (locale === "en") {
    const enSpec = await readSpecFromDir(implementationTraitsRootDir("en"), key);
    if (enSpec) return enSpec;
    const zhSpec = await readSpecFromDir(implementationTraitsRootDir("zh-CN"), key);
    if (zhSpec) zhSpec.untranslated = true;
    return zhSpec;
  }
  return readSpecFromDir(implementationTraitsRootDir("zh-CN"), key);
}

export async function listImplementationTraitSpecs(
  locale: string = "zh-CN",
): Promise<ImplementationTraitSpec[]> {
  const entries = await Promise.all(
    implementationTraitKeys.map((key) => readImplementationTraitSpec(key, locale)),
  );
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
