import { promises as fs } from "node:fs";
import path from "node:path";
import { isFeatureKey, type FeatureKey } from "@/lib/features/features";

export async function listFeatureImages(key: FeatureKey): Promise<string[]> {
  if (!isFeatureKey(key)) return [];
  const dir = path.join(process.cwd(), "public", "features", key);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|svg)$/i.test(name))
      .sort();
  } catch {
    return [];
  }
}
