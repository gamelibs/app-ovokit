import Link from "next/link";
import { NewPlayForm } from "@/components/mod/NewPlayForm";
import { isModerator } from "@/lib/mod/auth";

export default async function ModNewPlayPage() {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
        <h1 className="text-xl font-semibold">新建玩法</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          你还没有进入版主模式。请点击右上角菜单登录后再访问。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <h1 className="text-xl font-semibold">新建玩法（本地 JSON/MDX）</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        MVP：提交后写入 <code className="font-mono">content/plays/&lt;slug&gt;</code>
        ，并生成 <code className="font-mono">meta.json</code> /
        <code className="font-mono">article.mdx</code>。
      </p>
      <div className="mt-6">
        <NewPlayForm />
      </div>
    </main>
  );
}

