import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";
import { PlayStats } from "./PlayStats";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

export function PlayCard({ play }: { play: PlayMeta }) {
  return (
    <article className="sketch-card sketch-shadow-sm flex h-full flex-col overflow-hidden transition hover:shadow-md">
      {/* 封面：移动端更小，大屏正常 */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-paper-warm max-h-[100px] sm:max-h-none">
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
              className="relative z-10 h-full w-full object-contain p-1.5 sm:p-4"
              loading="lazy"
            />

            {/* 收藏按钮：图片右下角，小巧 */}
            <div className="absolute bottom-1.5 right-1.5 z-20 sm:bottom-3 sm:right-3">
              <FavoriteButton
                type="play"
                itemKey={play.slug}
                title={play.title}
                iconOnly
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="font-kalam rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-light">
              暂无封面
            </div>
          </div>
        )}
      </div>

      {/* 内容区：移动端紧凑 */}
      <div className="flex flex-1 flex-col p-2 sm:p-4">
        {/* 标签 */}
        <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
          {play.tags.slice(0, 2).map((t) => (
            <TagPill key={t} tone={t === "推荐" ? "primary" : "neutral"} size="sm">
              {t}
            </TagPill>
          ))}
        </div>

        {/* 标题：移动端单行，大屏最多 2 行 */}
        <h2 className="font-kalam mt-1.5 line-clamp-1 text-sm font-semibold leading-snug tracking-tight sm:line-clamp-2 sm:text-base">
          <Link href={`/play/${play.slug}`} className="hover:underline">
            {play.title}
          </Link>
        </h2>

        {/* 副标题：移动端单行 */}
        <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-ink-light sm:line-clamp-2 sm:text-sm sm:leading-6">
          {play.subtitle}
        </p>

        {/* 元信息：大屏显示，移动端隐藏 */}
        <dl className="mt-2 hidden text-xs text-ink-light sm:block">
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">玩法难度</dt>
            <dd className="min-w-0 font-medium text-ink">{play.difficulty}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">技术栈</dt>
            <dd className="min-w-0 truncate font-medium text-ink">{play.techStack.join(" / ")}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0 whitespace-nowrap text-ink-muted">核心点</dt>
            <dd className="min-w-0 truncate font-medium text-ink">{play.corePoints.join(" / ")}</dd>
          </div>
        </dl>

        {/* 底部操作 */}
        <div className="mt-auto grid gap-1.5 pt-2 sm:gap-3 sm:pt-4">
          <Link
            href={`/play/${play.slug}`}
            className="font-kalam inline-flex h-8 w-full items-center justify-center whitespace-nowrap rounded-lg bg-highlight-yellow px-2 text-xs font-semibold text-ink hover:bg-highlight-yellow/90 sm:h-10 sm:rounded-xl sm:text-sm"
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
