"use client";

import { useState } from "react";
import { Match3Viewer } from "@/demos/match3/Match3Viewer";

export default function Match3DevDemoPage() {
  const [key, setKey] = useState(0);
  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">三消 Demo 开发页</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              用于开发/调试 Match-3 的 state/action/events。展示实例建议用 iframe：`/embed/demos/match3`。
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            onClick={() => setKey((k) => k + 1)}
          >
            重载组件
          </button>
        </div>
      </div>

      <div className="mt-4">
        <Match3Viewer key={key} mode="dev" />
      </div>
    </main>
  );
}

