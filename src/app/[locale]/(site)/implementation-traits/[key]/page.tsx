import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImplementationTraitPage } from "@/components/implementation-traits/ImplementationTraitPage";
import { ImplementationTraitTabs } from "@/components/implementation-traits/ImplementationTraitTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getImplementationTraitImageSet } from "@/lib/implementation-traits/assets";
import {
  isImplementationTraitKey,
  implementationTraitKeys,
  type ImplementationTraitKey,
} from "@/lib/implementation-traits/implementation-traits";
import {
  listImplementationTraitSpecs,
  readImplementationTraitSpec,
} from "@/lib/implementation-traits/spec";
import { siteConfig } from "@/lib/site/config";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    implementationTraitKeys.map((key) => ({ locale, key })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isImplementationTraitKey(key)) {
    return {};
  }
  const spec = await readImplementationTraitSpec(key);
  if (!spec) {
    return {};
  }
  const title = `${spec.name}（${spec.nameEn}）| ${siteConfig.name}`;
  const description = spec.subtitle;
  return {
    title,
    description,
    alternates: {
      languages: {
        "zh-CN": `/implementation-traits/${key}`,
        en: `/en/implementation-traits/${key}`,
        "x-default": `/implementation-traits/${key}`,
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

export default async function ImplementationTraitDetailPage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale: rawLocale, key: rawKey } = await params;
  if (!isImplementationTraitKey(rawKey)) {
    notFound();
  }
  if (rawLocale === "en" || rawLocale === "zh-CN") {
    setRequestLocale(rawLocale);
  }
  const key = rawKey as ImplementationTraitKey;

  const [spec, images, specs] = await Promise.all([
    readImplementationTraitSpec(key),
    getImplementationTraitImageSet(key),
    listImplementationTraitSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="feature" />
      <ImplementationTraitTabs
        selectedKey={key}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      <div className="mt-4">
        <ImplementationTraitPage spec={spec} images={images} />
      </div>
    </main>
  );
}
