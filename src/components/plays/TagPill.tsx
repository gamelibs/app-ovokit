import type { ReactNode } from "react";

export function TagPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
  const styles =
    tone === "primary"
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/20"
      : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

