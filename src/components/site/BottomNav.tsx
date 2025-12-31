type NavItem = {
  label: string;
  iconPath: string;
  badge?: string;
};

const items: NavItem[] = [
  {
    label: "发现",
    iconPath: "M12 3l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
  },
  {
    label: "发布",
    iconPath:
      "M12 5v14M5 12h14",
  },
  {
    label: "通知",
    iconPath:
      "M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z",
    badge: "2",
  },
  {
    label: "我",
    iconPath:
      "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2-8 4.5V21h16v-2.5C20 16 16.4 14 12 14Z",
  },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur lg:hidden dark:border-white/10 dark:bg-black/60">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-4 px-2">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            className="relative flex flex-col items-center justify-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            aria-label={it.label}
          >
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
          </button>
        ))}
      </div>
    </nav>
  );
}

