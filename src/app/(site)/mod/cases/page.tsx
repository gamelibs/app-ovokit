import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { DeletePlayButton } from "@/components/mod/DeletePlayButton";
import { listPlaysWithMtime } from "@/lib/content/plays";

export const revalidate = 0;

type CaseItem = {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  views?: number;
  likes?: number;
  demoUrl?: string;
};

export default async function ModCasesPage() {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold">案例演示</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有进入版主模式。请连续点击顶部「OVOKIT」8 次打开版主入口，再登录后访问。
        </p>
      </main>
    );
  }

  const entries = await listPlaysWithMtime();
  const cases: CaseItem[] = entries
    .filter(({ meta }) => Boolean(meta.demo?.iframeSrc))
    .map(({ meta, mtimeMs }, idx) => ({
      id: idx + 1,
      title: meta.title,
      slug: meta.slug,
      createdAt: new Date(mtimeMs).toLocaleDateString("zh-CN"),
      views: meta.stats?.views ?? 0,
      likes: meta.stats?.likes ?? 0,
      demoUrl: meta.demo?.iframeSrc,
    }));
  const hasCases = cases.length > 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold">案例演示（交互积木）</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/mod"
            className="sketch-button sketch-button-secondary text-sm"
          >
            ← 返回内容管理
          </Link>
          <Link
            href="/demo/blocks"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-highlight-blue px-4 text-sm font-semibold text-ink hover:bg-highlight-blue/90 min-[360px]:min-w-[120px]"
          >
            创建案例
          </Link>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-light">
        此处展示“已在玩法 meta.json 中配置了 demo.iframeSrc”的帖子，便于快速复制 Demo 链接/嵌入地址。
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl sketch-border bg-paper">
        <div className="hidden sm:grid sm:grid-cols-[72px_1fr_200px_120px_120px_120px] sm:gap-3 sm:border-b sm:border-ink-light/20 sm:px-4 sm:py-3 sm:text-xs sm:font-semibold sm:text-ink-muted">
          <div>ID</div>
          <div>案例</div>
          <div className="text-right">创建时间</div>
          <div className="text-right">浏览</div>
          <div className="text-right">喜欢</div>
          <div className="text-right">操作</div>
        </div>

        <div className="divide-y divide-ink-light/20">
          {!hasCases ? (
            <div className="px-4 py-10 text-center text-sm text-ink-muted">
              暂无案例：请先在内容管理里为玩法配置 <code className="font-mono">demo.iframeSrc</code>（例如
              <code className="font-mono">/embed/demos/match3</code> 或{" "}
              <code className="font-mono">/embed/blocks/&lt;templateId&gt;</code>）。
            </div>
          ) : (
            cases.map((c) => (
              <div key={c.id} className="px-3 py-3 sm:px-4 sm:py-3">
                <div className="hidden items-center sm:grid sm:grid-cols-[72px_1fr_200px_120px_120px_120px] sm:gap-3">
                  <div className="rounded-full bg-paper-warm px-2 py-1 text-center text-xs font-semibold tabular-nums text-ink-light">
                    #{String(c.id).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">
                      {c.title}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      {c.demoUrl ? (
                        <a
                          href={c.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {c.demoUrl}
                        </a>
                      ) : (
                        "/demo/blocks"
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums text-ink-light">
                    {c.createdAt}
                  </div>
                  <div className="text-right text-sm tabular-nums text-ink-light">
                    {c.views ?? 0}
                  </div>
                  <div className="text-right text-sm tabular-nums text-ink-light">
                    {c.likes ?? 0}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/mod/edit/${c.slug}`}
                      className="inline-flex items-center justify-center rounded-full sketch-border bg-paper px-3 py-1 text-xs font-semibold hover:bg-paper-warm"
                    >
                      编辑
                    </Link>
                    <DeletePlayButton slug={c.slug} />
                  </div>
                </div>

                <div className="sm:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full bg-paper-warm px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-light">
                          #{String(c.id).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 truncate text-sm font-semibold text-ink">
                          {c.title}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-ink-muted">
                        {c.demoUrl ? (
                          <a
                            href={c.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {c.demoUrl}
                          </a>
                        ) : (
                          "/demo/blocks"
                        )}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-ink-muted">
                        <span>创建：{c.createdAt}</span>
                        <span className="text-right">浏览：{c.views ?? 0}</span>
                        <span className="text-right">喜欢：{c.likes ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/mod/edit/${c.slug}`}
                        className="shrink-0 rounded-full sketch-border bg-paper px-3 py-1 text-xs font-semibold hover:bg-paper-warm"
                      >
                        编辑
                      </Link>
                      <DeletePlayButton slug={c.slug} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-ink-light/20 bg-paper-warm/70 p-4 text-sm text-ink-light">
        <h3 className="text-sm font-semibold text-ink">挂载到帖子</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>在右上角“创建案例”进入交互编辑器，搭好 Demo，复制页面链接或 iframe 地址。</li>
          <li>
            到内容管理里编辑/创建玩法，在 <code className="font-mono">meta.json</code> 中的
            <code className="font-mono"> demo.iframeSrc </code> 填入链接。
          </li>
          <li>保存后，访客在帖子详情页即可看到并交互体验该案例。</li>
        </ol>
      </section>
    </main>
  );
}
