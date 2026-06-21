"use client";

import { Star } from "lucide-react";
import type { FavoriteItem, FavoriteType } from "@/lib/favorites/types";
import { useFavorites } from "./FavoritesProvider";

export function FavoriteButton({
  type,
  itemKey,
  title,
  className = "",
  iconOnly = false,
}: {
  type: FavoriteType;
  itemKey: string;
  title: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(type, itemKey);

  return (
    <button
      type="button"
      onClick={() =>
        toggle({ type, key: itemKey, title, addedAt: Date.now() } as FavoriteItem)
      }
      aria-label={active ? "取消收藏" : "加入收藏"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center transition ${
        iconOnly
          ? "h-7 w-7 rounded-full border-2 border-ink bg-paper/90 shadow-sm hover:bg-paper-warm"
          : `inline-flex items-center justify-center gap-1.5 rounded-xl sketch-border px-3 py-2 text-sm font-semibold ${
              active
                ? "bg-highlight-yellow text-ink hover:bg-highlight-yellow/90"
                : "bg-paper text-ink-light hover:bg-paper-warm hover:text-ink"
            }`
      } ${className}`}
    >
      <Star
        size={iconOnly ? 14 : 18}
        strokeWidth={2}
        className={active ? "fill-ink text-ink" : "text-ink-light"}
      />
      {!iconOnly && <span className="font-kalam">{active ? "已收藏" : "收藏"}</span>}
    </button>
  );
}
