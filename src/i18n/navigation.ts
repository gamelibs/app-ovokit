import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * 站点内部导航一律使用这里的 Link / useRouter / usePathname，
 * 它们会按当前 locale 自动加/去 /en 前缀（zh-CN 无前缀）。
 * 禁止在 (site) 树内直接 import next/link 或 next/navigation 的导航 API。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
