import type { ReactNode } from "react";

export function TagPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold";
  const styles =
    tone === "primary"
      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200"
      : "border-zinc-200/80 bg-white/80 text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

