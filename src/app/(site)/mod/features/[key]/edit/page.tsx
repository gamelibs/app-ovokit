import Link from "next/link";
import { notFound } from "next/navigation";
import { isModerator } from "@/lib/mod/auth";
import { isFeatureKey } from "@/lib/features/features";
import { readFeatureSpec } from "@/lib/features/spec";
import { listFeatureImages } from "@/lib/features/images";
import { FeatureEditForm } from "@/components/mod/FeatureEditForm";
import { FeatureImageUpload } from "@/components/mod/FeatureImageUpload";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function ModFeatureEditPage({ params }: PageProps) {
  const { key } = await params;
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">编辑玩法特征</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
      </main>
    );
  }

  if (!isFeatureKey(key)) {
    notFound();
  }

  const spec = await readFeatureSpec(key);
  if (!spec) {
    notFound();
  }
  const images = await listFeatureImages(key);

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold font-kalam">
          编辑：{spec.name}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/features/${encodeURIComponent(key)}`}
            target="_blank"
            className="sketch-button sketch-button-secondary text-sm"
          >
            预览
          </Link>
          <Link
            href="/mod/features"
            className="sketch-button sketch-button-secondary text-sm"
          >
            ← 列表
          </Link>
        </div>
      </div>
      <FeatureEditForm spec={spec} />

      <div className="mt-8 rounded-2xl sketch-border bg-paper p-4">
        <h2 className="text-base font-semibold font-kalam">玩法特征图片</h2>
        <div className="mt-3">
          <FeatureImageUpload featureKey={key} initialImages={images} />
        </div>
      </div>
    </main>
  );
}
