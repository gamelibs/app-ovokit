"use client";

import { BlockEditor } from "@/features/block-editor/BlockEditor";

export default function BlockDemoPage() {
  return (
    <main className="mx-auto flex h-[calc(100vh-80px)] max-w-6xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">BlockKit 交互积木编辑器</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            交互积木的 Demo 工作区：支持平移/缩放、多选框选、网格吸附、撤销重做、模板追加、属性面板、JSON 导入导出。
          </p>
        </div>
      </div>

      <BlockEditor />
    </main>
  );
}
