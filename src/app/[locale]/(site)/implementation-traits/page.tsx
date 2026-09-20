import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { ImplementationTraitTabs } from "@/components/implementation-traits/ImplementationTraitTabs";
import { ImplementationTraitPage } from "@/components/implementation-traits/ImplementationTraitPage";
import {
  isImplementationTraitKey,
  type ImplementationTraitKey,
} from "@/lib/implementation-traits/implementation-traits";
import {
  listImplementationTraitSpecs,
  readImplementationTraitSpec,
} from "@/lib/implementation-traits/spec";
import { getImplementationTraitImageSet } from "@/lib/implementation-traits/assets";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ImplementationTraitsPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string | string[] }>;
}) {
  const t = await getTranslations("implementationTraits");
  const sp = searchParams ? await searchParams : {};
  const rawKey = normalizeQueryParam(sp.key) ?? "generation";
  const selectedKey: ImplementationTraitKey = isImplementationTraitKey(rawKey)
    ? rawKey
    : "generation";

  const [spec, images, specs] = await Promise.all([
    readImplementationTraitSpec(selectedKey),
    getImplementationTraitImageSet(selectedKey),
    listImplementationTraitSpecs(),
  ]);

  if (!spec) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup="feature" />
      <h1 className="mt-2 text-xl font-semibold text-ink font-kalam">{t("title")}</h1>
      <ImplementationTraitTabs
        selectedKey={selectedKey}
        items={specs.map((s) => ({ key: s.key, label: s.name }))}
      />
      <ImplementationTraitPage spec={spec} images={images} embedded />
    </main>
  );
}
