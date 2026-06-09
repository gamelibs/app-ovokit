"use client";

import Link from "next/link";
import { DemoEmbed } from "@/components/demos/DemoEmbed";

type Props = {
  playSlug: string;
  playTitle: string;
  showEditorCta?: boolean;
};

export function InteractiveHero({ playSlug, playTitle, showEditorCta }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-100">
            直接上手 · 拖拽配对 Demo
          </div>
          <h2 className="text-xl font-semibold leading-tight text-zinc-900 sm:text-2xl dark:text-white">
            把积木拖到对应区域，试试交互手感
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            简单两步：按住蓝色/黄色积木，拖到同色区域；松手自动吸附，支持网格吸附与多次拖动。
          </p>
          <div className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            示例关联：{playTitle} · 点击/拖拽可扩展事件 · 可嵌入帖子 iframe 展示
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/60 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-zinc-100 px-3 py-2 text-[11px] text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">拖拽配对 Demo</span>
            <span>网格：10px</span>
            <span>缩放：100%</span>
          </div>

          <div className="aspect-[12/7] w-full">
            <DemoEmbed
              title="BlockKit Demo"
              src="/embed/blocks/drag-pairs"
              wrapperClassName="h-full w-full"
              controls="overlay"
              stageClassName="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-black/20"
              iframeClassName="rounded-xl border-0 bg-transparent shadow-none"
              allow="fullscreen; gamepad"
            />
          </div>

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

          <div className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            提示：在 Demo 区拖拽积木，页面滚动不会被干扰。
          </div>
        </div>
      </div>
    </section>
  );
}
