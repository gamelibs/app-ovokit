import type { Metadata } from "next";
import { listPlays } from "@/lib/content/plays";
import { FavoritesPageClient } from "@/components/favorites/FavoritesPageClient";

export const metadata: Metadata = {
  title: "我的收藏 - OVO",
  description: "浏览你在 OVO 收藏的内容。",
};

export default async function FavoritesPage() {
  const plays = await listPlays();

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <h1 className="font-kalam text-2xl font-bold text-ink">我的收藏</h1>
      <p className="mt-1 text-sm text-ink-light">
        收藏仅保存在当前浏览器，换设备不会同步。
      </p>

      <div className="mt-4">
        <FavoritesPageClient plays={plays} />
      </div>
    </main>
  );
}
