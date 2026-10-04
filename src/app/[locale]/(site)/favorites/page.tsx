import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { listPlays, type ContentLocale } from "@/lib/content/plays";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";
import { listPatternSpecs } from "@/lib/patterns/spec";
import { listFeatureSpecs } from "@/lib/features/spec";
import { FavoritesPageClient } from "@/components/favorites/FavoritesPageClient";
import { siteConfig } from "@/lib/site/config";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "favorites" });
  return {
    title: `${t("metaTitle")} - ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale) as ContentLocale;
  setRequestLocale(locale);
  const t = await getTranslations("favorites");
  const plays = await listPlays(locale);

  // 收藏实体的显示名按当前 locale 从 spec 数据实时解析（localStorage 里的 title
  // 是收藏那一刻的语言快照，切语言后会过期；服务端解析保证与 pillar 页一致）
  const [archetypes, patterns, features] = await Promise.all([
    listArchetypeSpecs(locale),
    listPatternSpecs(locale),
    listFeatureSpecs(locale),
  ]);
  const entityTitles: Record<string, string> = {};
  for (const s of archetypes) entityTitles[`archetype:${s.key}`] = s.name;
  for (const s of patterns) entityTitles[`pattern:${s.key}`] = s.name;
  for (const s of features) entityTitles[`feature:${s.key}`] = s.name;

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <h1 className="font-kalam text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-light">
        {t("note")}
      </p>

      <div className="mt-4">
        <FavoritesPageClient plays={plays} entityTitles={entityTitles} />
      </div>
    </main>
  );
}
