import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ key?: string | string[] }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams ?? Promise.resolve<{ key?: string | string[] }>({})]);
  const t = await getTranslations("pillar");
  const rawKey = normalizeQueryParam(sp.key) ?? "click";
  const selectedKey: FeatureKey = isFeatureKey(rawKey) ? rawKey : "click";

  const [spec, images, specs] = await Promise.all([
    readFeatureSpec(selectedKey, locale),
    getFeatureImageSet(selectedKey),
    listFeatureSpecs(locale),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="feature" />
      <FeatureTabs selectedKey={selectedKey} items={specs.map((s) => ({ key: s.key, label: s.name }))} />
      {spec.untranslated ? (
        <div className="mt-3 sketch-card bg-paper-warm p-3 text-sm text-ink-light">{t("untranslated")}</div>
      ) : null}
      <FeaturePage spec={spec} images={images} embedded />
    </main>
  );
}
