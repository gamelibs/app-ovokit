import Link from "next/link";
import { NewPlayForm } from "@/components/mod/NewPlayForm";
import { isModerator } from "@/lib/mod/auth";
import { listPatternSpecs } from "@/lib/patterns/spec";

export default async function ModNewPlayPage() {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">新建玩法</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl sketch-border bg-paper px-4 text-sm font-semibold hover:bg-paper-warm sm:h-10 sm:w-auto"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold font-kalam">新建玩法（本地 JSON/MDX）</h1>
        <Link
          href="/mod"
          className="sketch-button sketch-button-secondary text-sm"
        >
          ← 返回内容管理
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-light">
        MVP：提交后写入 <code className="font-mono">content/plays/&lt;slug&gt;</code>
        ，并生成 <code className="font-mono">meta.json</code> /
        <code className="font-mono">article.mdx</code>。
      </p>
      <div className="mt-6">
        <NewPlayForm patternSpecs={await listPatternSpecs()} />
      </div>
    </main>
  );
}
