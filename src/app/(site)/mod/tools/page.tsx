import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { DevToolsPanel } from "@/components/mod/DevToolsPanel";
import { GameAnalyzerButton } from "@/components/mod/GameAnalyzer";

export default async function ModToolsPage() {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="font-kalam text-xl font-semibold">开发者工具箱</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有进入版主模式。请连续点击顶部「OVOKIT」8 次打开版主入口，再输入口令登录。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-kalam min-w-0 truncate text-xl font-semibold">开发者工具箱</h1>
        <Link
          href="/mod"
          className="sketch-button sketch-button-secondary"
        >
          返回版主中心
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <GameAnalyzerButton />
      </div>

      <div className="mt-4">
        <DevToolsPanel />
      </div>
    </main>
  );
}
