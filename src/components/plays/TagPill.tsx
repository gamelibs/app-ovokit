import type { ReactNode } from "react";

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
    "font-kalam inline-flex items-center gap-1 border-2 border-ink rounded-full font-semibold";
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-3 py-1 text-xs";
  const styles =
    tone === "primary"
      ? "bg-highlight-blue text-ink"
      : "bg-paper text-ink-light";
  return <span className={`${base} ${sizeClass} ${styles}`}>{children}</span>;
}
