"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDialog } from "@/components/ui/AppDialog";

export function TogglePublishButton({
  slug,
  published,
}: {
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const dialog = useAppDialog();
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
      await dialog.alert(e instanceof Error ? e.message : "操作失败", { title: "操作失败" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex h-9 items-center justify-center rounded-full sketch-border px-4 text-xs font-semibold font-kalam disabled:opacity-50 ${
        current
          ? "bg-paper text-highlight-green hover:bg-highlight-green/10"
          : "bg-paper text-ink-light hover:bg-ink/5"
      }`}
      style={{ fontFamily: "var(--font-kalam)" }}
    >
      {busy ? "保存中..." : current ? "已发布" : "草稿"}
    </button>
  );
}
