import { promises as fs } from "node:fs";
import path from "node:path";

export type Glossary = Record<string, string>;

let cache: Glossary | null = null;

export async function loadGlossary(): Promise<Glossary> {
  if (cache) return cache;
  try {
    const filePath = path.join(process.cwd(), "content", "glossary.json");
    const raw = await fs.readFile(filePath, "utf8");
    cache = JSON.parse(raw) as Glossary;
    return cache;
  } catch {
    return {};
  }
}

export function getDefinition(glossary: Glossary, term: string): string | undefined {
  return glossary[term];
}
