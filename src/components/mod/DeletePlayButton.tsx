"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePlayButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`确定要删除「${slug}」吗？此操作不可恢复。`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/mod/plays/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="inline-flex h-9 items-center justify-center rounded-full border-2 border-highlight-red bg-paper px-4 text-xs font-semibold text-highlight-red hover:bg-highlight-red/10 disabled:opacity-50"
    >
      {busy ? "删除中..." : "删除"}
    </button>
  );
}
