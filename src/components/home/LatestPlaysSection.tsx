import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPlays, type ContentLocale } from "@/lib/content/plays";
import { inferArchetypeFromTags } from "@/lib/archetypes/tag-map";
import { localizeDifficulty } from "@/lib/content/play-tags";

function isSvg(src: string) {
  return src.endsWith(".svg");
}

/** 「最新发布」：按内容修改时间倒序，让新帖子（含平台导入游戏）始终可被发现 */
export async function LatestPlaysSection() {
  const locale = (await getLocale()) as ContentLocale;
  const t = await getTranslations("home");
  const plays = await listPlays(locale); // 已按 mtime 倒序
  // 封面是按母型模板生成的（同母型图片相同/近似），一行连续相同封面看起来像重复内容；
  // 同母型只露出一篇（显式 archetype 优先，tag 推断兜底），保证一行内的视觉多样性。
  const seenArchetypes = new Set<string>();
  const latest: typeof plays = [];
  for (const p of plays) {
    const key = p.archetype ?? inferArchetypeFromTags(p.tags);
    if (key) {
      if (seenArchetypes.has(key)) continue;
      seenArchetypes.add(key);
    }
    latest.push(p);
    if (latest.length >= 5) break;
  }
  if (latest.length === 0) return null;

  return (
    <section id="latest-plays" className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">{t("latestTitle")}</h2>
        <Link
          href={{ pathname: "/", query: { all: "1", group: "archetype" } }}
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          {t("viewAll")} →
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
                <span>{localizeDifficulty(play.difficulty, locale)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
