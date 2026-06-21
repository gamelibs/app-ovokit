import { notFound } from "next/navigation";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { FeatureTabs } from "@/components/features/FeatureTabs";
import { FeaturePage } from "@/components/features/FeaturePage";
import { isFeatureKey, type FeatureKey } from "@/lib/features/features";
import { listFeatureSpecs, readFeatureSpec } from "@/lib/features/spec";
import { getFeatureImageSet } from "@/lib/features/assets";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string | string[] }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const rawKey = normalizeQueryParam(sp.key) ?? "merge";
  const selectedKey: FeatureKey = isFeatureKey(rawKey) ? rawKey : "merge";

  const [spec, images, specs] = await Promise.all([
    readFeatureSpec(selectedKey),
    getFeatureImageSet(selectedKey),
    listFeatureSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="feature" />
      <FeatureTabs selectedKey={selectedKey} items={specs.map((s) => ({ key: s.key, label: s.name }))} />
      <FeaturePage spec={spec} images={images} embedded />
    </main>
  );
}
