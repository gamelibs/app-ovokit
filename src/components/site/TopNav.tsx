"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { OvoLogo } from "./OvoLogo";
import { DesktopNav } from "./DesktopNav";
import { MenuDrawer } from "./MenuDrawer";
import { useLocalStorageBoolean, useSetLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useClientValue } from "@/lib/hooks/useClientValue";
import { trackEvent } from "@/lib/analytics/events";

export function TopNav({ isModerator }: { isModerator: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const showModeratorTools = useLocalStorageBoolean("ovo_mod_tools");
  const setModTools = useSetLocalStorage("ovo_mod_tools");
  const tapCountRef = useRef(0);
  const lastTapAtRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialQuery = useClientValue(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
    "",
  );

  useEffect(() => {
    try {
      // 兼容旧 key：若存在 ovoforge_mod_tools 则迁移到 ovo_mod_tools
      const legacy = localStorage.getItem("ovoforge_mod_tools");
      if (legacy === "1") {
        localStorage.setItem("ovo_mod_tools", "1");
        localStorage.removeItem("ovoforge_mod_tools");
        window.dispatchEvent(new StorageEvent("storage", { key: "ovo_mod_tools" }));
      }
    } catch {
      // ignore
    }
  }, []);

  function goSearch() {
    const value = searchInputRef.current?.value ?? "";
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      trackEvent("search", { query: trimmed });
    }
    const target =
      trimmed.length > 0 ? `/?q=${encodeURIComponent(trimmed)}` : "/";
    router.push(target);
  }

  function onLogoTap() {
    const now = Date.now();
    const last = lastTapAtRef.current;
    lastTapAtRef.current = now;

    if (!last || now - last > 1500) {
      // Single tap or tap after a long pause → go home
      tapCountRef.current = 1;
      router.push("/");
      return;
    }

    // Rapid taps → count toward moderator unlock
    tapCountRef.current += 1;

    if (tapCountRef.current >= 8) {
      tapCountRef.current = 0;
      setModTools("1");
      if (isModerator) {
        router.push("/mod");
      } else {
        setOpen(true);
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-light/20 bg-paper/80 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-3 min-[360px]:px-4">
        <div className="flex h-14 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onLogoTap}
                aria-label="OVO"
                className="inline-flex items-center justify-center rounded-2xl p-0 hover:opacity-90 transition-opacity"
              >
                <OvoLogo width={60} height={28} />
              </button>
            </div>

            <div className="relative min-w-0 flex-1 max-w-xl lg:max-w-md xl:max-w-xl">
              <input
                ref={searchInputRef}
                placeholder="搜索玩法"
                defaultValue={initialQuery}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goSearch();
                }}
                inputMode="search"
                className="sketch-input h-9 w-full pl-3 pr-10 min-[360px]:h-10 min-[360px]:pl-4 min-[360px]:pr-11"
              />
              <button
                type="button"
                onClick={goSearch}
                aria-label="Search"
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center sketch-border bg-paper text-ink-muted hover:bg-paper-warm hover:text-ink min-[360px]:right-2"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="hidden sm:flex">
              <DesktopNav isModerator={isModerator} />
            </div>
          </div>

          <div className="flex items-center gap-1 text-ink-light">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-ink/5 sm:h-9 sm:w-9"
              aria-label="Menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <MenuDrawer
        open={open}
        onClose={() => setOpen(false)}
        showModeratorTools={showModeratorTools}
      />
    </header>
  );
}
