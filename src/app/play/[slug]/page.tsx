import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/plays/CodeBlock";
import { TagPill } from "@/components/plays/TagPill";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
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

            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-50 dark:from-white/10 dark:to-black">
              <div className="grid h-full place-items-center">
                <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                  封面占位（后续可接图片/视频）
                </div>
              </div>
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
              {play.demo.note ?? "后续将通过 iframe 嵌入可试玩 Demo。"}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
              <div className="aspect-video w-full">
                {play.demo.iframeSrc ? (
                  <iframe
                    title={`${play.title} Demo`}
                    src={play.demo.iframeSrc}
                    className="h-full w-full"
                    allow="fullscreen; gamepad; autoplay"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-zinc-500 dark:text-zinc-400">
                    iframe 占位（MVP）
                  </div>
                )}
              </div>
            </div>
          </section>

          {play.articleMdx ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-base font-semibold">文章（MDX 占位）</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                MVP 阶段暂不解析 MDX，仅展示原文内容（后续接入 MDX 渲染）。
              </p>
              <div className="mt-4">
                <CodeBlock language="mdx" code={play.articleMdx} />
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
            <h3 className="text-sm font-semibold">下一步</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
              <li>把玩法拆解变成可复用的结构（字段 + 组件）。</li>
              <li>接入 MDX 渲染与编辑流程。</li>
              <li>为 Demo 区增加 iframe 白名单与尺寸适配。</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
