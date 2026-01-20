import { ArchetypePage } from "@/components/archetypes/ArchetypePage";
import { ArchetypeTabs } from "@/components/archetypes/ArchetypeTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getArchetypePageModel } from "@/features/archetypes/pageModel";
import { getArchetypeImageSet } from "@/lib/archetypes/assets";
import { isPlayArchetypeKey, type PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ArchetypesPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string | string[] }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const rawKey = normalizeQueryParam(sp.key) ?? "match-clear";
  const selectedKey: PlayArchetypeKey = isPlayArchetypeKey(rawKey)
    ? (rawKey as PlayArchetypeKey)
    : "match-clear";
  const [model, images, specs] = await Promise.all([
    getArchetypePageModel(selectedKey),
    getArchetypeImageSet(selectedKey),
    listArchetypeSpecs(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="archetype" />
      <ArchetypeTabs selectedKey={selectedKey} items={specs.map((s) => ({ key: s.key, label: s.name }))} />
      <ArchetypePage model={model} images={images} embedded />
    </main>
  );
}
