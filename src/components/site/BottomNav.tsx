import Link from "next/link";
import { navItems } from "./navItems";

export function BottomNav({ isModerator }: { isModerator: boolean }) {
  const visibleItems = navItems.filter((it) =>
    it.requiresModerator ? isModerator : true,
  );
  const cols = Math.max(visibleItems.length, 1);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 min-w-[360px] border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-white/10 dark:bg-black/60"
      style={{
        transform: "translateX(calc(var(--ovokit-scroll-x, 0px) * -1))",
        willChange: "transform",
      }}
    >
      <div
        className="mx-auto grid h-14 max-w-6xl px-1.5 min-[360px]:px-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((it) => {
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
              <span>{it.label}</span>
              {it.badge ? (
                <span className="absolute right-6 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {it.badge}
                </span>
              ) : null}
            </>
          );

          const className =
            "relative flex flex-col items-center justify-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 min-[360px]:text-xs dark:text-zinc-300 dark:hover:text-zinc-50";

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
