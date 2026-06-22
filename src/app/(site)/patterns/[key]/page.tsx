import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatternPage } from "@/components/patterns/PatternPage";
import { PatternTabs } from "@/components/patterns/PatternTabs";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { getPatternImageSet } from "@/lib/patterns/assets";
import { isCorePatternKey, corePatternKeys, type CorePatternKey } from "@/lib/patterns/patterns";
import { listPatternSpecs, readPatternSpec } from "@/lib/patterns/spec";
import { siteConfig } from "@/lib/site/config";

export async function generateStaticParams() {
  return corePatternKeys.map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  if (!isCorePatternKey(key)) {
    return {};
  }
  const spec = await readPatternSpec(key);
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

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  if (!isCorePatternKey(rawKey)) {
    notFound();
  }
  const key = rawKey as CorePatternKey;

  const [spec, images, specs] = await Promise.all([
    readPatternSpec(key),
    getPatternImageSet(key),
    listPatternSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="pattern" />
      <PatternTabs
        selectedKey={key}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      <div className="mt-4">
        <PatternPage spec={spec} images={images} />
      </div>
    </main>
  );
}
