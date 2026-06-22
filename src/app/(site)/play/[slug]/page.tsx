import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";

function isSvg(src: string) {
  return src.endsWith(".svg");
}
import { CodeBlock } from "@/components/plays/CodeBlock";
import { TagPill } from "@/components/plays/TagPill";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { ArticleMarkdown } from "@/components/content/ArticleMarkdown";
import { PlayDetailStats } from "@/components/plays/PlayStats";
import { RelatedPlays } from "@/components/plays/RelatedPlays";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { getPlayBySlug, listPlaySlugs, listPlays } from "@/lib/content/plays";
import { loadGlossary } from "@/lib/content/glossary";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listPlaySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const play = await getPlayBySlug(slug);
  if (!play) return { title: "玩法不存在 - OVO" };

  const coverImage = play.coverWide?.src ?? play.cover?.src ?? null;
  const ogImage = coverImage ? `${siteConfig.url}${coverImage}` : undefined;

  return {
    title: `${play.title} - OVO`,
    description: play.subtitle,
    openGraph: {
      title: play.title,
      description: play.subtitle,
      type: "article",
      locale: "zh_CN",
      siteName: "OVO",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: play.title,
      description: play.subtitle,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [play, glossary] = await Promise.all([
    getPlayBySlug(slug),
    loadGlossary(),
  ]);
  if (!play) notFound();

  // Related plays: sort by tag overlap
  const allPlays = await listPlays();
  const currentTags = new Set(play.tags);
  const relatedPlays = allPlays
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      ...p,
      overlap: p.tags.filter((t) => currentTags.has(t)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 6);

  const inferredArchetypeKey = (() => {
    const tags = new Set(play.tags);
    if (tags.has("消除")) return "match-clear";
    if (tags.has("躲避")) return "dodge-avoid";
    if (tags.has("行进 / 跑酷")) return "runner";
    if (tags.has("射击")) return "shoot-aim";
    if (tags.has("战斗对抗") || tags.has("战斗")) return "combat";
    if (tags.has("放置 / 建造") || tags.has("放置")) return "placement";
    if (tags.has("策略决策") || tags.has("塔防") || tags.has("状态机")) return "choice-strategy";
    if (tags.has("物理")) return "physics";
    if (tags.has("解谜")) return "puzzle";
    if (tags.has("成长 / 数值") || tags.has("数值")) return "progression";
    if (tags.has("模拟")) return "simulation";
    if (tags.has("时机 / 反应") || tags.has("点击")) return "timing";
    return null;
  })();

  const fallbackPatternDemoSrc = play.pattern
    ? `/embed/demos/pattern/${play.pattern}`
    : null;

  const fallbackArchetypeDemoSrc = inferredArchetypeKey
    ? `/embed/demos/archetype/${inferredArchetypeKey}`
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-kalam inline-flex h-11 items-center gap-2 rounded-full sketch-border bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-warm sm:h-9 sm:px-3"
        >
          <span aria-hidden="true">←</span>
          返回
        </Link>
        <div className="text-sm text-ink-muted">
          玩法拆解 · 代码 · Demo
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <article className="space-y-4">
          <header className="sketch-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {play.tags.map((t) => (
                <TagPill key={t} tone={t === "推荐" ? "primary" : "neutral"}>
                  {t}
                </TagPill>
              ))}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight font-kalam">
                {play.title}
              </h1>
              <FavoriteButton
                type="play"
                itemKey={play.slug}
                title={play.title}
                iconOnly
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-light">
              {play.subtitle}
            </p>

            <div className="mt-3">
              <PlayDetailStats
                slug={play.slug}
                initialViews={play.stats.views}
                initialLikes={play.stats.likes}
              />
            </div>
          </header>

          {/* 移动端封面：小尺寸辅助识别，不抢夺内容焦点 */}
          {(play.coverWide?.src || play.cover?.src) && (
            <div className="lg:hidden">
              <div className="mx-auto aspect-[4/3] w-full max-w-sm max-h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-paper-warm to-paper">
                <div className="relative flex h-full w-full items-center justify-center p-4">
                  <Image
                    src={(play.coverWide?.src ?? play.cover?.src) as string}
                    alt={(play.coverWide?.alt ?? play.cover?.alt ?? play.title) as string}
                    fill
                    sizes="400px"
                    unoptimized={isSvg((play.coverWide?.src ?? play.cover?.src) as string)}
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          )}

          <section className="sketch-card p-5 shadow-sm">
            <h2 className="text-base font-semibold font-kalam">玩法拆解</h2>
            <div className="mt-4 space-y-4">
              {play.breakdown.map((b) => (
                <div key={b.title} className="rounded-xl bg-paper-warm p-4">
                  <div className="text-sm font-semibold text-ink">
                    {b.title}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-light">
                    {b.bullets.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="sketch-card p-5 shadow-sm">
            <h2 className="text-base font-semibold font-kalam">关键代码</h2>
            <div className="mt-4 space-y-3">
              {play.codeSnippets.map((s) => (
                <div key={s.title}>
                  <div className="mb-2 text-sm font-semibold text-ink">
                    {s.title}
                  </div>
                  <CodeBlock language={s.language} code={s.code} />
                </div>
              ))}
            </div>
          </section>

          <section className="sketch-card p-5 shadow-sm">
            <h2 className="text-base font-semibold font-kalam">Demo</h2>
            <p className="mt-2 text-sm text-ink-light">
              {play.demo.note ??
                (fallbackArchetypeDemoSrc
                  ? "暂未提供专用 Demo，已嵌入对应母型玩法的最小可试玩示例。"
                  : "暂未提供可试玩 Demo。")}
            </p>
            {play.demo.videoSrc ? (
              <div className="mt-4 overflow-hidden sketch-card-warm">
                <div className="h-[68vh] w-full sm:h-auto sm:aspect-video">
                  <video
                    src={play.demo.videoSrc}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                </div>
              </div>
            ) : play.demo.iframeSrc ? (
              <div className="mt-4">
                {/** Static HTML demos (e.g. ReferenceCase) can't receive postMessage reliably; reload is the safest restart. */}
                {(() => {
                  const isStaticDemo =
                    play.demo.iframeSrc?.startsWith("/embed/demos/sliding-puzzle-3d") ||
                    play.demo.iframeSrc?.startsWith("/embed/games/ReferenceCase/") ||
                    play.demo.iframeSrc?.startsWith("/referencecase") ||
                    (play.demo.iframeSrc?.endsWith(".html") ?? false);
                  return (
                <DemoEmbed
                  title={`${play.title} Demo`}
                  src={play.demo.iframeSrc}
                  controls="toolbar"
                  showRestart
                  restartStrategy={isStaticDemo ? "reload" : "postMessage"}
                />
                  );
                })()}
              </div>
            ) : fallbackPatternDemoSrc ? (
              <div className="mt-4">
                <DemoEmbed
                  title={`${play.title} Pattern Demo`}
                  src={fallbackPatternDemoSrc}
                  controls="toolbar"
                  showRestart
                  restartStrategy="postMessage"
                />
              </div>
            ) : fallbackArchetypeDemoSrc ? (
              <div className="mt-4">
                <DemoEmbed
                  title={`${play.title} Archetype Demo`}
                  src={fallbackArchetypeDemoSrc}
                  controls="toolbar"
                  showRestart
                  restartStrategy="postMessage"
                />
              </div>
            ) : (
              <div className="mt-4 overflow-hidden sketch-card-warm">
                <div className="h-[46vh] w-full sm:h-auto sm:aspect-video">
                  <div className="grid h-full place-items-center text-sm text-ink-muted">
                    暂无可试玩 Demo
                  </div>
                </div>
              </div>
            )}
          </section>

          {play.articleMdx ? (
            <section className="sketch-card p-5 shadow-sm">
              <h2 className="text-base font-semibold font-kalam">文章</h2>
              <p className="mt-2 text-sm text-ink-light">
                文章以 Markdown/MDX 文本子集渲染（不支持自定义组件）。
              </p>
              <div className="mt-4">
                <ArticleMarkdown source={play.articleMdx} glossary={glossary} />
              </div>
            </section>
          ) : null}

          <RelatedPlays currentSlug={slug} plays={relatedPlays} />
        </article>

        <aside className="hidden lg:block space-y-4">
          {/* 桌面端封面：作为侧边信息卡片，帮助快速识别主题 */}
          {(play.coverWide?.src || play.cover?.src) && (
            <section className="sketch-card p-4 shadow-sm">
              <div className="relative aspect-[4/3] w-full max-h-[180px] overflow-hidden rounded-xl bg-gradient-to-br from-paper-warm to-paper">
                <Image
                  src={(play.coverWide?.src ?? play.cover?.src) as string}
                  alt={(play.coverWide?.alt ?? play.cover?.alt ?? play.title) as string}
                  fill
                  sizes="(max-width: 1280px) 33vw, 400px"
                  unoptimized={isSvg((play.coverWide?.src ?? play.cover?.src) as string)}
                  className="object-contain p-3"
                  loading="lazy"
                />
              </div>
            </section>
          )}

          <section className="sketch-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold font-kalam">信息</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted font-kalam">难度</dt>
                <dd className="font-semibold">{play.difficulty}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-muted font-kalam">技术栈</dt>
                <dd className="text-right font-semibold">
                  {play.techStack.join(" / ")}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-muted font-kalam">核心点</dt>
                <dd className="text-right font-semibold">
                  {play.corePoints.join(" / ")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="sketch-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold font-kalam">阅读建议</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-light">
              <li>先看「玩法拆解」抓住规则与爽点。</li>
              <li>再看「关键代码」定位实现入口。</li>
              <li>最后试玩 Demo，体会参数与手感。</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
