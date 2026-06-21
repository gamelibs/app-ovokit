"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { FavoriteItem, FavoriteType } from "@/lib/favorites/types";
import {
  readFavorites,
  writeFavorites,
  isFavorited,
  toggleFavorite,
  notifyFavoritesChanged,
} from "@/lib/favorites/client";

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  isFavorite: (type: FavoriteType, key: string) => boolean;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (type: FavoriteType, key: string) => void;
  toggle: (item: FavoriteItem) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ovofroge:favorites:change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("ovofroge:favorites:change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return JSON.stringify(readFavorites());
}

function getServerSnapshot() {
  return "[]";
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorites = useMemo(
    () => JSON.parse(raw) as FavoriteItem[],
    [raw],
  );

  const persist = useCallback((next: FavoriteItem[]) => {
    writeFavorites(next);
    notifyFavoritesChanged();
  }, []);

  const addFavorite = useCallback(
    (item: FavoriteItem) => {
      const next = toggleFavorite(favorites, item);
      persist(next);
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (type: FavoriteType, key: string) => {
      const next = toggleFavorite(favorites, {
        type,
        key,
        title: "",
        addedAt: 0,
      });
      persist(next);
    },
    [favorites, persist],
  );

  const toggle = useCallback(
    (item: FavoriteItem) => {
      const next = toggleFavorite(favorites, item);
      persist(next);
    },
    [favorites, persist],
  );

  const isFav = useCallback(
    (type: FavoriteType, key: string) => isFavorited(type, key, favorites),
    [favorites],
  );

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: isFav,
      addFavorite,
      removeFavorite,
      toggle,
      count: favorites.length,
    }),
    [favorites, isFav, addFavorite, removeFavorite, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
