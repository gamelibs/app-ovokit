import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeaturePage } from "@/components/features/FeaturePage";
import { FeatureTabs } from "@/components/features/FeatureTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getFeatureImageSet } from "@/lib/features/assets";
import { isFeatureKey, featureKeys, type FeatureKey } from "@/lib/features/features";
import { listFeatureSpecs, readFeatureSpec } from "@/lib/features/spec";
import { siteConfig } from "@/lib/site/config";

export async function generateStaticParams() {
  return featureKeys.map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  if (!isFeatureKey(key)) {
    return {};
  }
  const spec = await readFeatureSpec(key);
  if (!spec) {
    return {};
  }
  const title = `${spec.name}（${spec.nameEn}）| ${siteConfig.name}`;
  const description = spec.subtitle;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "zh_CN",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  if (!isFeatureKey(rawKey)) {
    notFound();
  }
  const key = rawKey as FeatureKey;

  const [spec, images, specs] = await Promise.all([
    readFeatureSpec(key),
    getFeatureImageSet(key),
    listFeatureSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="feature" />
      <FeatureTabs
        selectedKey={key}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      <div className="mt-4">
        <FeaturePage spec={spec} images={images} />
      </div>
    </main>
  );
}
