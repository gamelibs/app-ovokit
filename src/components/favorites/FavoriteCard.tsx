"use client";

import { StarOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FavoriteItem } from "@/lib/favorites/types";
import { useFavorites } from "./FavoritesProvider";

function itemHref(item: FavoriteItem) {
  switch (item.type) {
    case "play":
      return `/play/${item.key}`;
    case "archetype":
      return `/archetypes/${encodeURIComponent(item.key)}`;
    case "pattern":
      return `/patterns/${encodeURIComponent(item.key)}`;
    case "feature":
      return `/features/${encodeURIComponent(item.key)}`;
  }
}

const TYPE_LABEL_KEYS = {
  play: "typePlay",
  archetype: "typeArchetype",
  pattern: "typePattern",
  feature: "typeFeature",
} as const;

export function FavoriteCard({ item }: { item: FavoriteItem }) {
  const t = useTranslations("favorites");
  const tFav = useTranslations("favorite");
  const { removeFavorite } = useFavorites();

  return (
    <article className="flex items-center gap-3 overflow-hidden sketch-card p-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted font-kalam">
          {t(TYPE_LABEL_KEYS[item.type])}
        </div>
        <h3 className="font-kalam mt-0.5 text-base font-semibold text-ink">
          <Link href={itemHref(item)} className="hover:underline">
            {item.title}
          </Link>
        </h3>
      </div>
      <button
        type="button"
        onClick={() => removeFavorite(item.type, item.key)}
        aria-label={tFav("removeAria")}
        className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl sketch-border bg-paper text-ink-light hover:bg-paper-warm hover:text-ink"
      >
        <StarOff size={18} strokeWidth={2} />
      </button>
    </article>
  );
}
