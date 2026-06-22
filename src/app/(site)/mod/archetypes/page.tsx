import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";

export const dynamic = "force-dynamic";

export default async function ModArchetypesPage() {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">母型玩法管理</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
      </main>
    );
  }

  const specs = await listArchetypeSpecs();

  return (
    <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold font-kalam">母型玩法管理</h1>
        <Link
          href="/mod"
          className="sketch-button sketch-button-secondary text-sm"
        >
          ← 返回内容管理
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-light">
        共 {specs.length} 个母型玩法。点击编辑可修改文案内容；图片请直接放入{" "}
        <code className="font-mono">public/archetypes/&lt;key&gt;/</code>。
      </p>

      <div className="mt-6 space-y-3">
        {specs.map((spec) => (
          <div
            key={spec.key}
            className="flex flex-col gap-2 rounded-2xl sketch-border bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="text-base font-semibold text-ink">
                {spec.name}
                <span className="ml-2 text-sm font-normal text-ink-light">
                  {spec.nameEn}
                </span>
              </div>
              <div className="mt-1 text-sm text-ink-light">{spec.subtitle}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {spec.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-paper-warm px-2 py-0.5 text-xs text-ink-light"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/archetypes/${encodeURIComponent(spec.key)}`}
                target="_blank"
                className="sketch-button sketch-button-secondary text-sm"
              >
                预览
              </Link>
              <Link
                href={`/mod/archetypes/${encodeURIComponent(spec.key)}/edit`}
                className="sketch-button text-sm"
              >
                编辑
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
