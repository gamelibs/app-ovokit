import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { isModerator } from "@/lib/mod/auth";
import { isImplementationTraitKey } from "@/lib/implementation-traits/implementation-traits";
import { readImplementationTraitSpec } from "@/lib/implementation-traits/spec";
import { listImplementationTraitImages } from "@/lib/implementation-traits/images";
import { FeatureEditForm } from "@/components/mod/FeatureEditForm";
import { FeatureImageUpload } from "@/components/mod/FeatureImageUpload";

export const dynamic = "force-dynamic";

const API_BASE = "/api/mod/implementation-traits";

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function ModImplementationTraitEditPage({ params }: PageProps) {
  const { key } = await params;
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">编辑工程特征</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
      </main>
    );
  }

  if (!isImplementationTraitKey(key)) {
    notFound();
  }

  const spec = await readImplementationTraitSpec(key);
  if (!spec) {
    notFound();
  }
  const images = await listImplementationTraitImages(key);

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold font-kalam">
          编辑：{spec.name}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/implementation-traits/${encodeURIComponent(key)}`}
            target="_blank"
            className="sketch-button sketch-button-secondary text-sm"
          >
            预览
          </Link>
          <Link
            href="/mod/implementation-traits"
            className="sketch-button sketch-button-secondary text-sm"
          >
            ← 列表
          </Link>
        </div>
      </div>
      <FeatureEditForm
        spec={spec}
        apiBase={API_BASE}
        backHref="/mod/implementation-traits"
        submitLabel="保存工程特征"
      />

      <div className="mt-8 rounded-2xl sketch-border bg-paper p-4">
        <h2 className="text-base font-semibold font-kalam">工程特征图片</h2>
        <div className="mt-3">
          <FeatureImageUpload
            featureKey={key}
            initialImages={images}
            apiBase={API_BASE}
            publicBase="/implementation-traits"
          />
        </div>
      </div>
    </main>
  );
}
