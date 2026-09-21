"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { Link } from "@/i18n/navigation";

function pillClass(active: boolean) {
  if (active) {
    return "inline-flex h-8 flex-none items-center justify-center rounded-full bg-ink px-3 text-xs font-semibold text-paper shadow-sm min-[360px]:h-9 min-[360px]:px-3.5 min-[360px]:text-[13px]";
  }
  return "inline-flex h-8 flex-none items-center justify-center rounded-full px-3 text-xs font-semibold text-ink-light hover:bg-ink/5 hover:text-ink min-[360px]:h-9 min-[360px]:px-3.5 min-[360px]:text-[13px]";
}

const EDGE_BTN =
  "absolute top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full sketch-border bg-paper text-xs font-bold text-ink-muted hover:text-ink";

export function ArchetypeTabs({
  selectedKey,
  items,
}: {
  selectedKey: PlayArchetypeKey;
  items: Array<{ key: PlayArchetypeKey; label: string }>;
}) {
  const t = useTranslations("pillar");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [occludedLeft, setOccludedLeft] = useState(false);
  const [occludedRight, setOccludedRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setOccludedLeft(el.scrollLeft > 1);
      setOccludedRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {occludedLeft && (
        <button
          type="button"
          aria-label={t("scrollLeft")}
          onClick={() => scrollBy(-1)}
          className={`${EDGE_BTN} left-0 bg-gradient-to-r from-paper to-transparent`}
        >
          «
        </button>
      )}
      <div
        ref={scrollerRef}
        className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-2.5 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((a) => (
          <Link
            key={a.key}
            href={`/archetypes/${encodeURIComponent(a.key)}`}
            className={pillClass(selectedKey === a.key)}
            aria-current={selectedKey === a.key ? "page" : undefined}
          >
            <span className="whitespace-nowrap">{a.label}</span>
          </Link>
        ))}
      </div>
      {occludedRight && (
        <button
          type="button"
          aria-label={t("scrollRight")}
          onClick={() => scrollBy(1)}
          className={`${EDGE_BTN} right-0 bg-gradient-to-l from-paper to-transparent`}
        >
          »
        </button>
      )}
    </div>
  );
}
