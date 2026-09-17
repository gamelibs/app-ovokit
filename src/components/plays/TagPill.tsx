import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { localizeTag } from "@/lib/content/play-tags";

export function TagPill({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
  size?: "sm" | "md";
}) {
  const base =
    "font-kalam inline-flex items-center gap-1 border border-ink-faint rounded-full font-semibold";
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-3 py-1 text-xs";
  const styles =
    tone === "primary"
      ? "bg-highlight-blue text-ink"
      : "bg-paper text-ink-light";
  // 显示层统一：旧标签自动映射为新词表名称（不动原数据）；英文 locale 出英文标签；废弃标签不渲染
  const locale = useLocale();
  const label = typeof children === "string" ? localizeTag(children, locale) : children;
  if (label === "") return null;
  return <span className={`${base} ${sizeClass} ${styles}`}>{label}</span>;
}
