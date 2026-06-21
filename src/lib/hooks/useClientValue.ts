"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * 在客户端渲染时获取一个只读值，同时保证 SSR / hydration 一致。
 *
 * 原理：hydration 期间使用 `serverValue`，hydration 完成后切换到 `getClientValue()`。
 * 适合封装 `window` / `document` / `localStorage` 等仅在客户端可用的 API。
 */
export function useClientValue<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    subscribe,
    () => getClientValue(),
    () => serverValue,
  );
}
