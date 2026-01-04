import Link from "next/link";
import { notFound } from "next/navigation";
import { NewPlayForm } from "@/components/mod/NewPlayForm";
import { getPlayBySlug } from "@/lib/content/plays";
import { isModerator } from "@/lib/mod/auth";

export default async function ModEditPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
        <h1 className="text-xl font-semibold">编辑玩法</h1>
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

  const { slug } = await params;
  const play = await getPlayBySlug(slug);
  if (!play) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <div className="sticky top-14 z-30 -mx-4 border-b border-zinc-200/70 bg-zinc-50/85 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/55">
        <h1 className="text-lg font-semibold sm:text-xl">编辑玩法</h1>
        <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-300 sm:text-sm">
          将覆盖写入 <code className="font-mono">content/plays/{slug}</code>{" "}
          的内容。
        </p>
      </div>
      <div className="mt-6">
        <NewPlayForm
          mode="edit"
          initial={{
            meta: play,
            articleMdx: play.articleMdx ?? "",
          }}
        />
      </div>
    </main>
  );
}
