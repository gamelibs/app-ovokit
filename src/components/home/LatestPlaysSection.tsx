import Link from "next/link";
import Image from "next/image";
import { listPlays } from "@/lib/content/plays";

function isSvg(src: string) {
  return src.endsWith(".svg");
}

/** 「最新发布」：按内容修改时间倒序，让新帖子（含平台导入游戏）始终可被发现 */
export async function LatestPlaysSection() {
  const plays = await listPlays(); // 已按 mtime 倒序
  const latest = plays.slice(0, 5);
  if (latest.length === 0) return null;

  return (
    <section id="latest-plays" className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">最新发布</h2>
        <Link
          href={{ pathname: "/", query: { all: "1", group: "archetype" } }}
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 min-[480px]:grid-cols-3 lg:grid-cols-5">
        {latest.map((play) => (
          <Link
            key={play.slug}
            href={`/play/${play.slug}`}
            className="sketch-card block overflow-hidden transition hover:scale-[1.02]"
          >
            {play.cover?.src ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-warm">
                <Image
                  src={play.cover.src}
                  alt={play.title}
                  fill
                  sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  unoptimized={isSvg(play.cover.src)}
                  className="object-contain p-4"
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="p-3 pt-2">
              <div className="font-kalam line-clamp-2 text-sm font-semibold leading-snug">
                {play.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-full border border-ink-faint px-2 py-0.5">NEW</span>
                <span>{play.difficulty}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
