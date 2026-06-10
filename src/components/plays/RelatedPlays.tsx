import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";

export function RelatedPlays({
  currentSlug,
  plays,
}: {
  currentSlug: string;
  plays: PlayMeta[];
}) {
  // Exclude current play
  const others = plays.filter((p) => p.slug !== currentSlug);
  if (others.length === 0) return null;

  // Take up to 3
  const related = others.slice(0, 3);

  return (
    <section className="sketch-card p-5 shadow-sm">
      <h2 className="font-kalam text-base font-semibold text-ink">你可能也喜欢</h2>
      <div className="mt-4 space-y-3">
        {related.map((p) => (
          <Link
            key={p.slug}
            href={`/play/${p.slug}`}
            className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-paper-warm"
          >
            <div className="h-14 w-20 flex-none overflow-hidden rounded-lg bg-paper-warm">
              {p.cover?.src ? (
                <img
                  src={p.cover.src}
                  alt={p.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-semibold text-ink group-hover:underline">
                {p.title}
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-light">
                {p.subtitle}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.tags.slice(0, 2).map((t) => (
                  <TagPill key={t} size="sm">
                    {t}
                  </TagPill>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
