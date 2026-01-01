"use client";

import Link from "next/link";
import { navItems } from "./navItems";

export function DesktopNav({ isModerator }: { isModerator: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-1 lg:flex"
    >
      {navItems
        .filter((it) => (it.requiresModerator ? isModerator : true))
        .map((it) => {
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
              <span className="sr-only xl:not-sr-only xl:whitespace-nowrap">
                {it.label}
              </span>
              {it.badge ? (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
                  {it.badge}
                </span>
              ) : null}
            </>
          );

          const className =
            "relative inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-zinc-700 hover:bg-black/5 hover:text-zinc-900 xl:px-3 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-zinc-50";

          return it.href ? (
            <Link
              key={it.label}
              href={it.href}
              className={className}
              aria-label={it.label}
            >
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
    </nav>
  );
}
