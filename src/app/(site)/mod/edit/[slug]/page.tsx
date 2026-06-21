import Link from "next/link";
import { notFound } from "next/navigation";
import { NewPlayForm } from "@/components/mod/NewPlayForm";
import { getPlayBySlug } from "@/lib/content/plays";
import { isModerator } from "@/lib/mod/auth";
import { listPatternSpecs } from "@/lib/patterns/spec";

export default async function ModEditPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-24 pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">编辑玩法</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-4 text-sm font-semibold hover:bg-paper-warm"
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
    <main className="mx-auto w-full max-w-3xl px-3 pb-24 pt-6 min-[360px]:px-4">
      <div className="sticky top-14 z-30 -mx-3 border-b border-ink-light/20 bg-paper-warm/85 px-3 py-3 backdrop-blur min-[360px]:-mx-4 min-[360px]:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold sm:text-xl font-kalam">编辑玩法</h1>
            <p className="mt-1 truncate text-xs text-ink-light sm:text-sm">
              将覆盖写入 <code className="font-mono">content/plays/{slug}</code>{" "}
              的内容。
            </p>
          </div>
          <Link
            href="/mod"
            className="shrink-0 sketch-button sketch-button-secondary text-sm"
          >
            ← 返回内容管理
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <NewPlayForm
          mode="edit"
          patternSpecs={await listPatternSpecs()}
          initial={{
            meta: play,
            articleMdx: play.articleMdx ?? "",
          }}
        />
      </div>
    </main>
  );
}
