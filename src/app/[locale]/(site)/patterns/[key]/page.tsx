import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatternPage } from "@/components/patterns/PatternPage";
import { PatternTabs } from "@/components/patterns/PatternTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getPatternImageSet } from "@/lib/patterns/assets";
import { isCorePatternKey, corePatternKeys, type CorePatternKey } from "@/lib/patterns/patterns";
import { listPatternSpecs, readPatternSpec } from "@/lib/patterns/spec";
import { listPlays, type ContentLocale } from "@/lib/content/plays";
import { siteConfig } from "@/lib/site/config";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    corePatternKeys.map((key) => ({ locale, key })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isCorePatternKey(key)) {
    return {};
  }
  const spec = await readPatternSpec(key, locale);
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
        "zh-CN": `/patterns/${key}`,
        en: `/en/patterns/${key}`,
        "x-default": `/patterns/${key}`,
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

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale: rawLocale, key: rawKey } = await params;
  if (!isCorePatternKey(rawKey)) {
    notFound();
  }
  const locale: ContentLocale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setRequestLocale(locale);
  const key = rawKey as CorePatternKey;

  const [t, spec, images, specs, allPlays] = await Promise.all([
    getTranslations("pillar"),
    readPatternSpec(key, locale),
    getPatternImageSet(key),
    listPatternSpecs(locale),
    listPlays(locale),
  ]);

  if (!spec) {
    notFound();
  }
  const relatedPlays = allPlays
    .filter((p) => p.pattern === key)
    .slice(0, 6)
    .map((p) => ({ slug: p.slug, title: p.title, subtitle: p.subtitle }));

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="pattern" />
      <PatternTabs
        selectedKey={key}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      {spec.untranslated ? (
        <div className="mt-3 sketch-card bg-paper-warm p-3 text-sm text-ink-light">{t("untranslated")}</div>
      ) : null}
      <div className="mt-4">
        <PatternPage spec={spec} images={images} relatedPlays={relatedPlays} />
      </div>
    </main>
  );
}
