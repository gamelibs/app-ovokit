"use client";

import Link from "next/link";
import { navItems } from "./navItems";

export function DesktopNav({ isModerator }: { isModerator: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className="hidden shrink-0 items-center gap-1 lg:flex"
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
              <span className="font-kalam hidden whitespace-nowrap xl:inline">
                {it.label}
              </span>
              {it.badge ? (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight-red px-1 text-[11px] font-semibold leading-none text-ink">
                  {it.badge}
                </span>
              ) : null}
            </>
          );

          const className =
            "font-kalam relative inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-ink-light hover:bg-ink/5 hover:text-ink xl:px-3";

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
