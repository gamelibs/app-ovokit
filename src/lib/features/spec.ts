import { promises as fs } from "node:fs";
import path from "node:path";
import { featureKeys, type FeatureKey, type FeatureMeta } from "./features";

export type FeatureSpec = FeatureMeta & {
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 内容语言目录：zh-CN → content/features，en → content/features-en（缺失时回退中文） */
function featuresRootDir(locale: string = "zh-CN") {
  return path.join(process.cwd(), "content", locale === "en" ? "features-en" : "features");
}

async function readSpecFromDir(rootDir: string, key: FeatureKey): Promise<FeatureSpec | null> {
  try {
    const metaPath = path.join(rootDir, key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as FeatureSpec;
  } catch {
    return null;
  }
}

export async function readFeatureSpec(
  key: FeatureKey,
  locale: string = "zh-CN",
): Promise<FeatureSpec | null> {
  if (locale === "en") {
    const enSpec = await readSpecFromDir(featuresRootDir("en"), key);
    if (enSpec) return enSpec;
    const zhSpec = await readSpecFromDir(featuresRootDir("zh-CN"), key);
    if (zhSpec) zhSpec.untranslated = true;
    return zhSpec;
  }
  return readSpecFromDir(featuresRootDir("zh-CN"), key);
}

export async function listFeatureSpecs(locale: string = "zh-CN"): Promise<FeatureSpec[]> {
  const entries = await Promise.all(featureKeys.map((key) => readFeatureSpec(key, locale)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
