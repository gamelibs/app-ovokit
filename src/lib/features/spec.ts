import { promises as fs } from "node:fs";
import path from "node:path";
import { featureKeys, type FeatureKey, type FeatureMeta } from "./features";

export type FeatureSpec = FeatureMeta;

function featuresRootDir() {
  return path.join(process.cwd(), "content", "features");
}

export async function readFeatureSpec(key: FeatureKey): Promise<FeatureSpec | null> {
  try {
    const metaPath = path.join(featuresRootDir(), key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as FeatureSpec;
  } catch {
    return null;
  }
}

export async function listFeatureSpecs(): Promise<FeatureSpec[]> {
  const entries = await Promise.all(featureKeys.map((key) => readFeatureSpec(key)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
