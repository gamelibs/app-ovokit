import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/plays/CodeBlock";
import { TagPill } from "@/components/plays/TagPill";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { ArticleMarkdown } from "@/components/content/ArticleMarkdown";
import { getPlayBySlug, listPlaySlugs } from "@/lib/content/plays";

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
  if (!play) return { title: "玩法不存在 - OVOKIT" };
  return {
    title: `${play.title} - OVOKIT`,
    description: play.subtitle,
  };
}

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const play = await getPlayBySlug(slug);
  if (!play) notFound();

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

  const fallbackArchetypeDemoSrc = inferredArchetypeKey
    ? `/embed/demos/archetype/${inferredArchetypeKey}`
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:h-9 sm:px-3 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
        >
          <span aria-hidden="true">←</span>
          返回
        </Link>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          玩法拆解 · 代码 · Demo
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <article className="space-y-4">
          <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
              {play.tags.map((t) => (
                <TagPill key={t} tone={t === "推荐" ? "primary" : "neutral"}>
                  {t}
                </TagPill>
              ))}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {play.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {play.subtitle}
            </p>

            <div className="mt-4 aspect-[4/3] w-full max-h-[420px] overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-50 dark:from-white/10 dark:to-black">
              {play.coverWide?.src || play.cover?.src ? (
                <div className="relative h-full w-full">
                  {/* Background fill (blurred) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(play.coverWide?.src ?? play.cover?.src) as string}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-55"
                  />
                  <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

                  {/* Foreground (full image) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(play.coverWide?.src ?? play.cover?.src) as string}
                    alt={(play.coverWide?.alt ?? play.cover?.alt ?? play.title) as string}
                    className="relative z-10 h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    暂无封面
                  </div>
                </div>
              )}
            </div>
          </header>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-semibold">玩法拆解</h2>
            <div className="mt-4 space-y-4">
              {play.breakdown.map((b) => (
                <div key={b.title} className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {b.title}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                    {b.bullets.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-semibold">关键代码</h2>
            <div className="mt-4 space-y-3">
              {play.codeSnippets.map((s) => (
                <div key={s.title}>
                  <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {s.title}
                  </div>
                  <CodeBlock language={s.language} code={s.code} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-semibold">Demo</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {play.demo.note ??
                (fallbackArchetypeDemoSrc
                  ? "暂未提供专用 Demo，已嵌入对应母型玩法的最小可试玩示例。"
                  : "暂未提供可试玩 Demo。")}
            </p>
            {play.demo.videoSrc ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
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
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
                <div className="h-[46vh] w-full sm:h-auto sm:aspect-video">
                  <div className="grid h-full place-items-center text-sm text-zinc-500 dark:text-zinc-400">
                    暂无可试玩 Demo
                  </div>
                </div>
              </div>
            )}
          </section>

          {play.articleMdx ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-base font-semibold">文章</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                文章以 Markdown/MDX 文本子集渲染（不支持自定义组件）。
              </p>
              <div className="mt-4">
                <ArticleMarkdown source={play.articleMdx} />
              </div>
            </section>
          ) : null}
        </article>

        <aside className="hidden lg:block space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="text-sm font-semibold">信息</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">难度</dt>
                <dd className="font-semibold">{play.difficulty}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">技术栈</dt>
                <dd className="text-right font-semibold">
                  {play.techStack.join(" / ")}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">核心点</dt>
                <dd className="text-right font-semibold">
                  {play.corePoints.join(" / ")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="text-sm font-semibold">阅读建议</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
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
