import { promises as fs } from "node:fs";
import path from "node:path";
import { isCorePatternKey, type CorePatternKey } from "@/lib/patterns/patterns";

export async function getPatternImageSet(key: CorePatternKey) {
  if (!isCorePatternKey(key)) {
    return { hero: null, interaction: null, rule: null, advanced: null };
  }
  const dir = path.join(process.cwd(), "public", "patterns", key);
  const names = ["hero", "interaction", "rule", "advanced"] as const;
  const exts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];

  async function find(name: string): Promise<string | null> {
    for (const ext of exts) {
      const candidate = path.join(dir, `${name}${ext}`);
      try {
        await fs.access(candidate);
        return `/patterns/${key}/${name}${ext}`;
      } catch {
        // continue
      }
    }
    return null;
  }

  const entries = await Promise.all(names.map((name) => find(name)));
  return {
    hero: entries[0],
    interaction: entries[1],
    rule: entries[2],
    advanced: entries[3],
  };
}
