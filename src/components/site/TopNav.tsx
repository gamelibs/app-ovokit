"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopNav } from "./DesktopNav";
import { MenuDrawer } from "./MenuDrawer";

export function TopNav({ isModerator }: { isModerator: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("q") ?? "");
  }, []);

  function goSearch() {
    const trimmed = q.trim();
    const target = trimmed.length > 0 ? `/?q=${encodeURIComponent(trimmed)}` : "/";
    router.push(target);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex h-14 items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-lime-300 px-3 py-1 text-sm font-bold tracking-tight text-black">
                OVOKIT
              </div>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
              <div className="relative min-w-0 flex-1 max-w-xl lg:max-w-md xl:max-w-xl">
                <input
                  placeholder="搜索玩法"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goSearch();
                  }}
                  inputMode="search"
                  className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-4 pr-11 text-sm text-zinc-900 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/40 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-white/10"
                />
                <button
                  type="button"
                  onClick={goSearch}
                  aria-label="Search"
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
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
              </div>

              <DesktopNav isModerator={isModerator} />
            </div>
          </div>

          <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-200">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 sm:h-9 sm:w-9 dark:hover:bg-white/10"
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

        <div className="pb-3 sm:hidden">
          <div className="relative w-full">
            <input
              placeholder="搜索玩法"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goSearch();
              }}
              inputMode="search"
              className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-4 pr-11 text-sm text-zinc-900 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/40 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-white/10"
            />
            <button
              type="button"
              onClick={goSearch}
              aria-label="Search"
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
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
          </div>
        </div>
      </div>

      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

