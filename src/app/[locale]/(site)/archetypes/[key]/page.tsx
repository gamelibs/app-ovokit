import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchetypePage } from "@/components/archetypes/ArchetypePage";
import { ArchetypeTabs } from "@/components/archetypes/ArchetypeTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getArchetypePageModel } from "@/features/archetypes/pageModel";
import { getArchetypeImageSet } from "@/lib/archetypes/assets";
import {
  isPlayArchetypeKey,
  playArchetypeKeys,
  type PlayArchetypeKey,
} from "@/lib/archetypes/archetypes";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";
import { siteConfig } from "@/lib/site/config";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    playArchetypeKeys.map((key) => ({ locale, key })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isPlayArchetypeKey(key)) {
    return {};
  }
  const model = await getArchetypePageModel(key);
  const title = `${model.title} | ${siteConfig.name}`;
  const description = model.subtitle;
  return {
    title,
    description,
    alternates: {
      languages: {
        "zh-CN": `/archetypes/${key}`,
        en: `/en/archetypes/${key}`,
        "x-default": `/archetypes/${key}`,
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

export default async function ArchetypeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale: rawLocale, key: rawKey } = await params;
  if (!isPlayArchetypeKey(rawKey)) {
    notFound();
  }
  if (rawLocale === "en" || rawLocale === "zh-CN") {
    setRequestLocale(rawLocale);
  }
  const key = rawKey as PlayArchetypeKey;

  const [model, images, specs] = await Promise.all([
    getArchetypePageModel(key),
    getArchetypeImageSet(key),
    listArchetypeSpecs(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="archetype" />
      <ArchetypeTabs
        selectedKey={key}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      <div className="mt-4">
        <ArchetypePage model={model} images={images} />
      </div>
    </main>
  );
}
