"use client";

import Link from "next/link";
import { navItems } from "./navItems";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export function BottomNav({ isModerator }: { isModerator: boolean }) {
  const { count } = useFavorites();
  const visibleItems = navItems.filter((it) =>
    it.requiresModerator ? isModerator : true,
  );
  const cols = Math.max(visibleItems.length, 1);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 min-w-[360px] border-t-2 border-ink sketch-border-thin bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      style={{
        transform: "translateX(calc(var(--ovoforge-scroll-x, 0px) * -1))",
        willChange: "transform",
      }}
    >
      <div
        className="mx-auto grid h-14 max-w-6xl px-1.5 min-[360px]:px-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((it) => {
          const badge = it.label === "收藏" && count > 0 ? String(count) : it.badge;

          const inner = (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d={it.iconPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-kalam">{it.label}</span>
              {badge ? (
                <span className="absolute right-6 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight-red px-1 text-[10px] font-semibold text-ink">
                  {badge}
                </span>
              ) : null}
            </>
          );

          const className =
            "relative flex flex-col items-center justify-center gap-1 text-[11px] text-ink-light hover:text-ink min-[360px]:text-xs";

          return it.href ? (
            <Link key={it.label} href={it.href} className={className}>
              {inner}
            </Link>
          ) : (
            <button
              key={it.label}
              type="button"
              className={`${className} opacity-60`}
              aria-label={it.label}
              disabled
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
