"use client";

import { useClientValue } from "./useClientValue";

/**
 * 检测当前浏览器是否支持全屏 API。
 *
 * 初始返回 `false` 以保证 SSR 与 hydration 一致，
 * 挂载后再根据 `document.fullscreenEnabled` 更新。
 */
export function useCanFullscreen(): boolean {
  return useClientValue(
    () => typeof document !== "undefined" && Boolean(document.fullscreenEnabled),
    false,
  );
}
