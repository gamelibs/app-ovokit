import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";

function isSvg(src: string) {
  return src.endsWith(".svg");
}
import { CodeBlock } from "@/components/plays/CodeBlock";
import { localizeTag } from "@/lib/content/play-tags";
import { TagPill } from "@/components/plays/TagPill";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { ArticleMarkdown } from "@/components/content/ArticleMarkdown";
import { PlayDetailStats } from "@/components/plays/PlayStats";
import { RelatedPlays } from "@/components/plays/RelatedPlays";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { getPlayBySlug, listPlaySlugs, listPlays, type ContentLocale } from "@/lib/content/plays";
import { loadGlossary } from "@/lib/content/glossary";
import { inferArchetypeFromTags } from "@/lib/archetypes/tag-map";
import { isPlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { readArchetypeSpec } from "@/lib/archetypes/spec";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listPlaySlugs();
  // 双语静态产物：zh-CN 无前缀 + en 前缀（en 缺稿 slug 走中文回退，仍可静态化）
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

function resolveLocale(raw: string): ContentLocale {
  // [locale]/layout.tsx 已对非法 locale 404，这里仅做类型收窄
  return (hasLocale(routing.locales, raw) ? raw : routing.defaultLocale) as ContentLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const play = await getPlayBySlug(slug, locale);
  const notFoundTitle = (await getTranslations({ locale, namespace: "play" }))("notFoundTitle");
  if (!play) return { title: `${notFoundTitle} - ${siteConfig.name}` };

  const coverImage = play.coverWide?.src ?? play.cover?.src ?? null;
  const ogImage = coverImage ? `${siteConfig.url}${coverImage}` : undefined;
  const canonical = locale === "en" ? `/en/play/${slug}` : `/play/${slug}`;

  return {
    title: `${play.title} - ${siteConfig.name}`,
    description: play.subtitle,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `/play/${slug}`,
        en: `/en/play/${slug}`,
        "x-default": `/play/${slug}`,
      },
    },
    openGraph: {
      title: play.title,
      description: play.subtitle,
      type: "article",
      locale: locale === "en" ? "en_US" : "zh_CN",
      siteName: siteConfig.name,
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "play" });

  const [play, glossary] = await Promise.all([
    getPlayBySlug(slug, locale),
    loadGlossary(),
  ]);
  if (!play) notFound();

  // Related plays: sort by tag overlap
  const allPlays = await listPlays(locale);
  const currentTags = new Set(play.tags);
  const relatedPlays = allPlays
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      ...p,
      overlap: p.tags.filter((t) => currentTags.has(t)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 6);

  // 母型归属：优先读 meta.archetype（ContentPack v1.1 生产线显式写入）；
  // 缺失时退回 tag → taxonomy 映射推断（site-tags.v1.json），见 src/lib/archetypes/tag-map.ts
  const explicitArchetypeKey =
    play.archetype && isPlayArchetypeKey(play.archetype) ? play.archetype : null;
  const inferredArchetypeKey = explicitArchetypeKey ?? inferArchetypeFromTags(play.tags);
  const archetypeSpec = inferredArchetypeKey
    ? await readArchetypeSpec(inferredArchetypeKey)
    : null;

  const fallbackPatternDemoSrc = play.pattern
    ? `/embed/demos/pattern/${play.pattern}`
    : null;

  const fallbackArchetypeDemoSrc = inferredArchetypeKey
    ? `/embed/demos/archetype/${inferredArchetypeKey}`
    : null;

  // demo 画面方向：竖屏游戏（v2 平台预览 750×1334 / 原子母型 demo 2:3）用竖版容器
  const demoOrientation = (src?: string | null): "portrait" | "landscape" => {
    if (!src) return "portrait"; // pattern/archetype 兜底 demo 均为竖屏原子 demo
    if (src.includes("preview-assets") || src.includes("/demos/atomic/")) return "portrait";
    if (src.includes("/api/v2/projects/")) return "portrait"; // v2 平台预览固定 750×1334 竖屏
    if (src.includes("/embed/plays/")) return "portrait"; // v2 项目静态导出包同为 750×1334 竖屏
    if (src.includes("/embed/demos/pattern") || src.includes("/embed/demos/archetype")) return "portrait";
    return "landscape";
  };

  // 本机/内网 demo 地址不对读者暴露（静态 demo 导出落地前的隔离守卫）：
  // meta 里的地址原样保留、继续被存量审查追踪，这里只决定页面不渲染 iframe/video。
  const isPrivateDemoSrc = (src?: string | null): boolean => {
    if (!src) return false;
    return /^https?:\/\/(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i.test(src);
  };
  const demoSrcBlocked =
    isPrivateDemoSrc(play.demo?.videoSrc) || isPrivateDemoSrc(play.demo?.iframeSrc);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-kalam inline-flex h-11 items-center gap-2 rounded-full sketch-border bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-warm sm:h-9 sm:px-3"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>
        <div className="text-sm text-ink-muted">
          {t("crumb")}
        </div>
      </div>

      {play.untranslated ? (
        <div className="mt-3 sketch-card bg-paper-warm p-3 text-sm text-ink-light">
          {t("untranslated")}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <article className="flex flex-col gap-4">
          <header className="sketch-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {play.tags.map((tag) => (
                <TagPill key={tag} tone={tag === "推荐" ? "primary" : "neutral"}>
                  {tag}
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

          <section className="sketch-card p-5 shadow-sm order-3">
            <h2 className="text-base font-semibold font-kalam">{t("breakdownTitle")}</h2>
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

          <section className="sketch-card p-5 shadow-sm order-4">
            <h2 className="text-base font-semibold font-kalam">{t("codeTitle")}</h2>
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

          {archetypeSpec ? (
            // 母型归属卡：收编到文章末尾（不抢 demo/正文位置），紧凑单行，不诱导跳出
            <section className="sketch-card px-4 py-3 shadow-sm order-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-ink-light">
                  <span className="font-semibold text-ink-muted">{t("behaviorTitle")}：</span>
                  {t("belongsTo", { name: locale === "en" ? (localizeTag(archetypeSpec.name, locale) || archetypeSpec.name) : archetypeSpec.name })}
                  {locale !== "en" ? (
                    <span className="ml-2 text-ink-faint">{archetypeSpec.subtitle}</span>
                  ) : null}
                </div>
                <Link
                  href={`/archetypes/${archetypeSpec.key}`}
                  className="font-kalam inline-flex h-9 items-center gap-2 rounded-full sketch-border bg-paper px-3 text-xs font-semibold text-ink-light hover:bg-paper-warm"
                >
                  {t("viewArchetype")}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
          ) : null}

          <section className="sketch-card p-5 shadow-sm order-2">
            <h2 className="text-base font-semibold font-kalam">{t("demoTitle")}</h2>
            <p className="mt-2 text-sm text-ink-light">
              {play.demo?.note ??
                (fallbackArchetypeDemoSrc
                  ? t("demoFallbackArchetype")
                  : t("demoNone"))}
            </p>
            {demoSrcBlocked ? (
              <div className="mt-4 overflow-hidden sketch-card-warm">
                <div className="h-[46vh] w-full sm:h-auto sm:aspect-video">
                  <div className="grid h-full place-items-center px-6 text-center text-sm leading-6 text-ink-muted">
                    {t("demoBlocked")}
                  </div>
                </div>
              </div>
            ) : play.demo.videoSrc ? (
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
                {/** 静态 HTML demo 无法可靠接收 postMessage，reload 是最稳的重启方式。 */}
                {(() => {
                  const isStaticDemo = play.demo.iframeSrc?.endsWith(".html") ?? false;
                  return (
                <DemoEmbed
                  title={`${play.title} Demo`}
                  src={play.demo.iframeSrc}
                  controls="toolbar"
                  showRestart
                  restartStrategy={isStaticDemo ? "reload" : "postMessage"}
                  orientation={demoOrientation(play.demo.iframeSrc)}
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
                  orientation="portrait"
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
                  orientation="portrait"
                />
              </div>
            ) : (
              <div className="mt-4 overflow-hidden sketch-card-warm">
                <div className="h-[46vh] w-full sm:h-auto sm:aspect-video">
                  <div className="grid h-full place-items-center text-sm text-ink-muted">
                    {t("demoEmpty")}
                  </div>
                </div>
              </div>
            )}
          </section>

          {play.articleMdx ? (
            <section className="sketch-card p-5 shadow-sm order-5">
              <h2 className="text-base font-semibold font-kalam">{t("articleTitle")}</h2>
              <div className="mt-4">
                <ArticleMarkdown source={play.articleMdx} glossary={glossary} />
              </div>
            </section>
          ) : null}

          <div className="order-6">
            <RelatedPlays currentSlug={slug} plays={relatedPlays} />
          </div>
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
            <h3 className="text-sm font-semibold font-kalam">{t("infoTitle")}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted font-kalam">{t("difficultyLabel")}</dt>
                <dd className="font-semibold">{play.difficulty}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-muted font-kalam">{t("techStackLabel")}</dt>
                <dd className="text-right font-semibold">
                  {play.techStack.join(" / ")}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-muted font-kalam">{t("corePointsLabel")}</dt>
                <dd className="text-right font-semibold">
                  {play.corePoints.join(" / ")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="sketch-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold font-kalam">{t("tipsTitle")}</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-light">
              <li>{t("tip1")}</li>
              <li>{t("tip2")}</li>
              <li>{t("tip3")}</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
