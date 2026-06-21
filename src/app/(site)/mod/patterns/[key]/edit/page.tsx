import Link from "next/link";
import { notFound } from "next/navigation";
import { isModerator } from "@/lib/mod/auth";
import { isCorePatternKey } from "@/lib/patterns/patterns";
import { readPatternSpec } from "@/lib/patterns/spec";
import { listPatternImages } from "@/lib/patterns/images";
import { PatternEditForm } from "@/components/mod/PatternEditForm";
import { PatternImageUpload } from "@/components/mod/PatternImageUpload";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function ModPatternEditPage({ params }: PageProps) {
  const { key } = await params;
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">编辑核心玩法</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
      </main>
    );
  }

  if (!isCorePatternKey(key)) {
    notFound();
  }

  const spec = await readPatternSpec(key);
  if (!spec) {
    notFound();
  }
  const images = await listPatternImages(key);

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold font-kalam">
          编辑：{spec.name}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/patterns?key=${encodeURIComponent(key)}`}
            target="_blank"
            className="sketch-button sketch-button-secondary text-sm"
          >
            预览
          </Link>
          <Link
            href="/mod/patterns"
            className="sketch-button sketch-button-secondary text-sm"
          >
            ← 列表
          </Link>
        </div>
      </div>
      <PatternEditForm spec={spec} />

      <div className="mt-8 rounded-2xl sketch-border bg-paper p-4">
        <h2 className="text-base font-semibold font-kalam">核心玩法图片</h2>
        <div className="mt-3">
          <PatternImageUpload patternKey={key} initialImages={images} />
        </div>
      </div>
    </main>
  );
}
