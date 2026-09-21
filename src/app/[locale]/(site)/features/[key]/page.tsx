import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeaturePage } from "@/components/features/FeaturePage";
import { FeatureTabs } from "@/components/features/FeatureTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getFeatureImageSet } from "@/lib/features/assets";
import { isFeatureKey, featureKeys, type FeatureKey } from "@/lib/features/features";
import { listFeatureSpecs, readFeatureSpec } from "@/lib/features/spec";
import { siteConfig } from "@/lib/site/config";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    featureKeys.map((key) => ({ locale, key })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isFeatureKey(key)) {
    return {};
  }
  const spec = await readFeatureSpec(key, locale);
  if (!spec) {
    return {};
  }
  const nameTitle = spec.name === spec.nameEn ? spec.name : `${spec.name}（${spec.nameEn}）`;
  const title = `${nameTitle} | ${siteConfig.name}`;
  const description = spec.subtitle;
  return {
    title,
    description,
    alternates: {
      languages: {
        "zh-CN": `/features/${key}`,
        en: `/en/features/${key}`,
        "x-default": `/features/${key}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: locale === "en" ? "en_US" : "zh_CN",
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
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale: rawLocale, key: rawKey } = await params;
  if (!isFeatureKey(rawKey)) {
    notFound();
  }
  if (rawLocale === "en" || rawLocale === "zh-CN") {
    setRequestLocale(rawLocale);
  }
  const key = rawKey as FeatureKey;

  const [t, spec, images, specs] = await Promise.all([
    getTranslations("pillar"),
    readFeatureSpec(key, rawLocale),
    getFeatureImageSet(key),
    listFeatureSpecs(rawLocale),
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
      {spec.untranslated ? (
        <div className="mt-3 sketch-card bg-paper-warm p-3 text-sm text-ink-light">{t("untranslated")}</div>
      ) : null}
      <div className="mt-4">
        <FeaturePage spec={spec} images={images} />
      </div>
    </main>
  );
}
