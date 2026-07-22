"use client";

import { useState } from "react";

export function CopyDemoLinkButton({ demoUrl }: { demoUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const absolute = demoUrl.startsWith("http")
      ? demoUrl
      : `${window.location.origin}${demoUrl}`;
    try {
      await navigator.clipboard.writeText(absolute);
    } catch {
      // 剪贴板不可用时降级为手动选择
      window.prompt("复制 Demo 地址：", absolute);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={demoUrl}
      className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full sketch-border bg-paper px-4 text-xs font-semibold hover:bg-paper-warm"
      style={{ fontFamily: "var(--font-kalam)" }}
    >
      {copied ? "✓ 已复制" : "复制Demo"}
    </button>
  );
}
