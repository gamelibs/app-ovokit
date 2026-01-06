import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";

function formatCompactNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function PlayCard({ play }: { play: PlayMeta }) {
  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5">
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-50 dark:from-white/10 dark:to-black min-[420px]:aspect-[3/4]">
          {play.cover?.src ? (
            <div className="relative h-full w-full">
              {/* Background fill (blurred) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={play.cover.src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/15" aria-hidden="true" />

              {/* Foreground (full image) */}
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
              <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                封面占位
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="收藏"
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-zinc-800 shadow-sm backdrop-blur hover:bg-white sm:h-9 sm:w-9 dark:bg-black/50 dark:text-zinc-100 dark:hover:bg-black/70"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M12 5v14M5 12h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="p-3 min-[360px]:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {play.tags.slice(0, 6).map((t) => (
            <TagPill key={t} tone={t === "推荐" ? "primary" : "neutral"}>
              {t}
            </TagPill>
          ))}
        </div>

        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          <Link href={`/play/${play.slug}`} className="hover:underline">
            {play.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {play.subtitle}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
              玩法难度
            </dt>
            <dd className="min-w-0 font-medium">{play.difficulty}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
              技术栈
            </dt>
            <dd className="min-w-0 truncate font-medium">
              {play.techStack.join(" / ")}
            </dd>
          </div>
          <div className="col-span-2 flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
              核心点
            </dt>
            <dd className="min-w-0 truncate font-medium">
              {play.corePoints.join(" / ")}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white opacity-60 sm:h-10 sm:px-4"
              aria-label="立即调试（即将支持）"
            >
              立即调试
            </button>
            <Link
              href={`/play/${play.slug}`}
              className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:h-10 sm:px-4 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              查看实现
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {formatCompactNumber(play.stats.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M12 21s-7-4.4-9.5-8.4C.8 9.4 2.2 6.5 5 5.7c1.7-.5 3.5.1 4.6 1.5C10.5 5.8 12.3 5.2 14 5.7c2.8.8 4.2 3.7 2.5 6.9C19 16.6 12 21 12 21Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              {formatCompactNumber(play.stats.likes)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
