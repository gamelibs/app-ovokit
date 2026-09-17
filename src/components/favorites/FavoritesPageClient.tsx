"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PlayMeta } from "@/lib/content/plays";
import type { FavoriteItem } from "@/lib/favorites/types";
import { useFavorites } from "./FavoritesProvider";
import { FavoriteCard } from "./FavoriteCard";
import { PlayCard } from "@/components/plays/PlayCard";

export function FavoritesPageClient({ plays }: { plays: PlayMeta[] }) {
  const t = useTranslations("favorites");
  const { favorites } = useFavorites();

  const enriched = useMemo(() => {
    const playMap = new Map(plays.map((p) => [p.slug, p]));

    type Enriched = { item: FavoriteItem; play?: PlayMeta };

    return favorites
      .map((item): Enriched | null => {
        if (item.type === "play") {
          const play = playMap.get(item.key);
          return play ? { item, play } : null;
        }
        return { item };
      })
      .filter((e): e is Enriched => Boolean(e));
  }, [favorites, plays]);

  if (favorites.length === 0) {
    return (
      <div className="sketch-card p-6 text-center text-sm text-ink-light">
        <p>{t("emptyLine1")}</p>
        <p className="mt-1">{t("emptyLine2")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-ink-muted">
        {t("totalCount", { count: favorites.length })}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {enriched.map(({ item, play }) =>
          play ? (
            <PlayCard key={`${item.type}:${item.key}`} play={play} />
          ) : (
            <FavoriteCard key={`${item.type}:${item.key}`} item={item} />
          ),
        )}
      </div>
    </div>
  );
}
