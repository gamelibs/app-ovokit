import { promises as fs } from "node:fs";
import path from "node:path";
import {
  implementationTraitKeys,
  type ImplementationTraitKey,
  type ImplementationTraitMeta,
} from "./implementation-traits";

export type ImplementationTraitSpec = ImplementationTraitMeta;

function implementationTraitsRootDir() {
  return path.join(process.cwd(), "content", "implementation-traits");
}

export async function readImplementationTraitSpec(
  key: ImplementationTraitKey
): Promise<ImplementationTraitSpec | null> {
  try {
    const metaPath = path.join(implementationTraitsRootDir(), key, "meta.json");
    const raw = await fs.readFile(metaPath, "utf8");
    return JSON.parse(raw) as ImplementationTraitSpec;
  } catch {
    return null;
  }
}

export async function listImplementationTraitSpecs(): Promise<ImplementationTraitSpec[]> {
  const entries = await Promise.all(
    implementationTraitKeys.map((key) => readImplementationTraitSpec(key))
  );
  return entries.filter((e): e is NonNullable<typeof e> => Boolean(e));
}
