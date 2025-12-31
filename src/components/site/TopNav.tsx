"use client";

import { useState } from "react";
import { MenuDrawer } from "./MenuDrawer";

export function TopNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-lime-300 px-3 py-1 text-sm font-bold tracking-tight text-black">
            OVOKIT
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              placeholder="搜索玩法"
              className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/40 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-white/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Search"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5 21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
