import { notFound } from "next/navigation";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { PatternTabs } from "@/components/patterns/PatternTabs";
import { PatternPage } from "@/components/patterns/PatternPage";
import { isCorePatternKey, type CorePatternKey } from "@/lib/patterns/patterns";
import { listPatternSpecs, readPatternSpec } from "@/lib/patterns/spec";
import { getPatternImageSet } from "@/lib/patterns/assets";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PatternsPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string | string[] }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const rawKey = normalizeQueryParam(sp.key) ?? "action";
  const selectedKey: CorePatternKey = isCorePatternKey(rawKey) ? rawKey : "action";

  const [spec, images, specs] = await Promise.all([
    readPatternSpec(selectedKey),
    getPatternImageSet(selectedKey),
    listPatternSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="pattern" />
      <PatternTabs selectedKey={selectedKey} items={specs.map((s) => ({ key: s.key, label: s.name }))} />
      <PatternPage spec={spec} images={images} embedded />
    </main>
  );
}
