"use client";

import { useCallback, useSyncExternalStore } from "react";

function getSnapshot(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getServerSnapshot(): null {
  return null;
}

function subscribe(key: string, callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (evt: StorageEvent) => {
    if (evt.key === key) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * 基于 useSyncExternalStore 的 localStorage Hook。
 *
 * 避免在 useEffect 中直接调用 setState，同时支持跨标签页同步。
 */
export function useLocalStorage(key: string): string | null {
  return useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot(key),
    getServerSnapshot,
  );
}

export function useLocalStorageBoolean(key: string, defaultValue = false): boolean {
  const raw = useLocalStorage(key);
  return raw === null ? defaultValue : raw === "1" || raw === "true";
}

export function useSetLocalStorage(key: string) {
  return useCallback(
    (value: string | null) => {
      if (typeof window === "undefined") return;
      try {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
        // 触发同页面订阅更新
        window.dispatchEvent(new StorageEvent("storage", { key }));
      } catch {
        // ignore
      }
    },
    [key],
  );
}
