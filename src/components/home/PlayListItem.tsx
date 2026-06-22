import Link from "next/link";
import Image from "next/image";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "@/components/plays/TagPill";
import { Eye } from "lucide-react";

function isSvg(src: string) {
  return src.endsWith(".svg");
}

function formatCompactNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function PlayListItem({ play }: { play: PlayMeta }) {
  return (
    <Link
      href={`/play/${play.slug}`}
      className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-paper-warm sm:gap-4 sm:p-3"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg sketch-border bg-paper-warm sm:h-20 sm:w-20">
        {play.cover?.src ? (
          <Image
            src={play.cover.src}
            alt={play.cover.alt ?? play.title}
            fill
            sizes="80px"
            unoptimized={isSvg(play.cover.src)}
            className="object-contain"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="text-xs text-ink-muted">📄</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-ink group-hover:underline sm:text-base font-kalam">
          {play.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-light sm:text-sm">
          {play.subtitle}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {play.tags.slice(0, 3).map((t) => (
            <TagPill key={t} size="sm" tone={t === "推荐" ? "primary" : "neutral"}>
              {t}
            </TagPill>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <Eye size={12} strokeWidth={2} />
            {formatCompactNumber(play.stats.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
