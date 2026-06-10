"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TogglePublishButton({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(published);

  async function toggle() {
    const next = !current;
    setBusy(true);
    try {
      const res = await fetch("/api/mod/plays/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, published: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCurrent(next);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold disabled:opacity-50 ${
        current
          ? "border-2 border-highlight-green bg-paper text-highlight-green hover:bg-highlight-green/10"
          : "border-2 border-ink-light/30 bg-paper text-ink-light hover:bg-ink/5"
      }`}
    >
      {busy ? "保存中..." : current ? "已发布" : "草稿"}
    </button>
  );
}
