"use client";

import Link from "next/link";

type Props = {
  playSlug: string;
  playTitle: string;
  showEditorCta?: boolean;
};

export function InteractiveHero({ playSlug, playTitle, showEditorCta }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-100">
            直接上手 · 拖拽配对 Demo
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">把积木拖到对应区域，试试交互手感</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            简单两步：按住蓝色/黄色积木，拖到同色区域；松手自动吸附，支持网格吸附与多次拖动。
          </p>
          <div className="flex flex-wrap gap-2">
            {showEditorCta ? (
              <Link
                href="/demo/blocks"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                进入完整编辑器
              </Link>
            ) : null}
            <a
              href={`/play/${playSlug}`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              查看示例帖子
            </a>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>示例关联：{playTitle}</span>
            <span>点击/拖拽行为可扩展事件</span>
            <span>可嵌入帖子 iframe 展示</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-950/95 p-3 shadow-inner ring-1 ring-zinc-900 dark:border-white/10 lg:w-auto">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-black/60 px-3 py-2 text-[11px] text-zinc-400">
            <span>示例：拖拽配对</span>
            <span>网格：10px</span>
            <span>缩放：100%</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/60 p-3">
            <div className="aspect-[12/7] w-full max-w-[720px]">
              <iframe
                title="BlockKit Demo"
                src="/embed/blocks/drag-pairs"
                className="h-full w-full rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
                allow="fullscreen; gamepad"
                loading="lazy"
              />
            </div>
          </div>
          <div className="text-[11px] text-zinc-500">提示：在 Demo 区拖拽积木，页面滚动不会被干扰。</div>
        </div>
      </div>
    </section>
  );
}
