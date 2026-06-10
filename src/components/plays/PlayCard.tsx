import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";
import { PlayStats } from "./PlayStats";



export function PlayCard({ play }: { play: PlayMeta }) {
  return (
    <article className="mb-4 break-inside-avoid overflow-hidden sketch-card sketch-shadow-sm transition hover:shadow-md">
      <div className="relative">
        <div className="aspect-[4/3] w-full max-h-[180px] overflow-hidden bg-paper-warm min-[420px]:aspect-[3/4] min-[420px]:max-h-[220px]">
          {play.cover?.src ? (
            <div className="relative h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={play.cover.src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-ink/10" aria-hidden="true" />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={play.cover.src}
                alt={play.cover.alt ?? play.title}
                className="relative z-10 h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="font-kalam rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-light">
                暂无封面
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 min-[360px]:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {play.tags.slice(0, 6).map((t) => (
            <TagPill key={t} tone={t === "推荐" ? "primary" : "neutral"}>
              {t}
            </TagPill>
          ))}
        </div>

        <h2 className="font-kalam mt-3 text-lg font-semibold tracking-tight">
          <Link href={`/play/${play.slug}`} className="hover:underline">
            {play.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-light">
          {play.subtitle}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">
              玩法难度
            </dt>
            <dd className="min-w-0 font-medium">{play.difficulty}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">
              技术栈
            </dt>
            <dd className="min-w-0 truncate font-medium">
              {play.techStack.join(" / ")}
            </dd>
          </div>
          <div className="col-span-2 flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">
              核心点
            </dt>
            <dd className="min-w-0 truncate font-medium">
              {play.corePoints.join(" / ")}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3">
          <Link
            href={`/play/${play.slug}`}
            className="font-kalam inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-xl bg-highlight-yellow px-3 text-sm font-semibold text-ink hover:bg-highlight-yellow/90 sm:h-10 sm:px-4"
          >
            查看实现
          </Link>

          <PlayStats
            slug={play.slug}
            initialViews={play.stats.views}
            initialLikes={play.stats.likes}
          />
        </div>
      </div>
    </article>
  );
}
