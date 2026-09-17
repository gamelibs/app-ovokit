"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { navItems } from "./navItems";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export function DesktopNav({ isModerator }: { isModerator: boolean }) {
  const { count } = useFavorites();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Primary"
      className="hidden shrink-0 items-center gap-1 lg:flex"
    >
      {navItems
        .filter((it) => (it.requiresModerator ? isModerator : true))
        .map((it) => {
          const label = t(it.key);
          const badge = it.key === "favorites" && count > 0 ? String(count) : it.badge;

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
              <span className="font-kalam hidden whitespace-nowrap xl:inline">
                {label}
              </span>
              {badge ? (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight-red px-1 text-[11px] font-semibold leading-none text-ink">
                  {badge}
                </span>
              ) : null}
            </>
          );

          const className =
            "font-kalam relative inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-ink-light hover:bg-ink/5 hover:text-ink xl:px-3";

          return it.href ? (
            <Link
              key={it.key}
              href={it.href}
              className={className}
              aria-label={label}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={it.key}
              type="button"
              className={`${className} opacity-60`}
              aria-label={label}
              disabled
            >
              {inner}
            </button>
          );
        })}
    </nav>
  );
}
