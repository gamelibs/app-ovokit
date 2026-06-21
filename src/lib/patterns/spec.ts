import { promises as fs } from "node:fs";
import path from "node:path";
import {
  corePatternKeys,
  type CorePatternKey,
  type CorePatternMeta,
} from "./patterns";

export type CorePatternSpec = CorePatternMeta;

function patternsRootDir() {
  return path.join(process.cwd(), "content", "patterns");
}

export async function readPatternSpec(key: CorePatternKey): Promise<CorePatternSpec | null> {
  try {
    const metaPath = path.join(patternsRootDir(), key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as CorePatternSpec;
  } catch {
    return null;
  }
}

export async function listPatternSpecs(): Promise<CorePatternSpec[]> {
  const entries = await Promise.all(corePatternKeys.map((key) => readPatternSpec(key)));
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
