import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { listPlays, type ContentLocale } from "@/lib/content/plays";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <h1 className="font-kalam text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-light">
        {t("note")}
      </p>

      <div className="mt-4">
        <FavoritesPageClient plays={plays} />
      </div>
    </main>
  );
}
