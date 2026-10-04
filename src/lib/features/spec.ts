import { promises as fs } from "node:fs";
import path from "node:path";
import { featureKeys, type FeatureKey, type FeatureMeta } from "./features";

export type FeatureSpec = FeatureMeta & {
  /** en 请求回退中文内容时标记 true（页面据此展示「暂未翻译」提示） */
  untranslated?: boolean;
};

/** 内容语言目录：zh-CN → content/features，其余语言 → content/features-{locale}（缺失按 自有→en→zh 链回退） */
function featuresRootDir(locale: string = "zh-CN") {
  return path.join(process.cwd(), "content", locale === "zh-CN" ? "features" : `features-${locale}`);
}

function localeCandidates(locale: string): string[] {
  if (locale === "zh-CN") return ["zh-CN"];
  if (locale === "en") return ["en", "zh-CN"];
  return [locale, "en", "zh-CN"];
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
  for (const candidate of localeCandidates(locale)) {
    const spec = await readSpecFromDir(featuresRootDir(candidate), key);
    if (spec) {
      spec.untranslated = candidate !== locale;
      return spec;
    }
  }
  return null;
}

export async function listFeatureSpecs(locale: string = "zh-CN"): Promise<FeatureSpec[]> {
  const entries = await Promise.all(featureKeys.map((key) => readFeatureSpec(key, locale)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
