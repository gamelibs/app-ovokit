"use client";

import type { FavoriteItem, FavoriteType } from "./types";

const STORAGE_KEY = "ovoforge_favorites";

export function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as FavoriteItem[];
  } catch {
    // ignore malformed storage
  }
  return [];
}

export function writeFavorites(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function buildFavoriteKey(type: FavoriteType, key: string) {
  return `${type}:${key}`;
}

export function isFavorited(type: FavoriteType, key: string, items: FavoriteItem[]) {
  const target = buildFavoriteKey(type, key);
  return items.some((it) => buildFavoriteKey(it.type, it.key) === target);
}

export function toggleFavorite(
  items: FavoriteItem[],
  next: FavoriteItem,
): FavoriteItem[] {
  const target = buildFavoriteKey(next.type, next.key);
  const exists = items.some(
    (it) => buildFavoriteKey(it.type, it.key) === target,
  );
  if (exists) {
    return items.filter(
      (it) => buildFavoriteKey(it.type, it.key) !== target,
    );
  }
  return [next, ...items];
}

export function notifyFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ovoforge:favorites:change"));
}
