import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";

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
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          你还没有进入版主模式。请点击右上角菜单登录后再访问。
        </p>
      </main>
    );
  }

  // TODO: 接入真实存储。当前示例为空列表。
  const cases: CaseItem[] = [];
  const hasCases = cases.length > 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold">案例演示（交互积木）</h1>
        <Link
          href="/demo/blocks"
          className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 min-[360px]:min-w-[120px]"
        >
          创建案例
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        用积木式交互快速搭建玩法案例，可绑定点击/拖动等行为，生成 Demo 后挂载到帖子给访客体验。
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="hidden sm:grid sm:grid-cols-[72px_1fr_200px_120px_120px_120px] sm:gap-3 sm:border-b sm:border-zinc-200 sm:px-4 sm:py-3 sm:text-xs sm:font-semibold sm:text-zinc-500 dark:sm:border-white/10 dark:sm:text-zinc-400">
          <div>ID</div>
          <div>案例</div>
          <div className="text-right">创建时间</div>
          <div className="text-right">浏览</div>
          <div className="text-right">喜欢</div>
          <div className="text-right">操作</div>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-white/10">
          {!hasCases ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-300">
              暂无案例，请先点击右上角“创建案例”进入积木编辑器搭建 Demo。
            </div>
          ) : (
            cases.map((c) => (
              <div key={c.id} className="px-3 py-3 sm:px-4 sm:py-3">
                <div className="hidden items-center sm:grid sm:grid-cols-[72px_1fr_200px_120px_120px_120px] sm:gap-3">
                  <div className="rounded-full bg-zinc-100 px-2 py-1 text-center text-xs font-semibold tabular-nums text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    #{String(c.id).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {c.title}
                    </div>
                    <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {c.demoUrl ?? "/demo/blocks"}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                    {c.createdAt}
                  </div>
                  <div className="text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                    {c.views ?? 0}
                  </div>
                  <div className="text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                    {c.likes ?? 0}
                  </div>
                  <div className="text-right">
                    <Link
                      href={c.demoUrl ?? "/demo/blocks"}
                      className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      编辑
                    </Link>
                  </div>
                </div>

                <div className="sm:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                          #{String(c.id).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {c.title}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {c.demoUrl ?? "/demo/blocks"}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>创建：{c.createdAt}</span>
                        <span className="text-right">浏览：{c.views ?? 0}</span>
                        <span className="text-right">喜欢：{c.likes ?? 0}</span>
                      </div>
                    </div>
                    <Link
                      href={c.demoUrl ?? "/demo/blocks"}
                      className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      编辑
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-white">挂载到帖子</h3>
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
