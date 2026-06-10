import Link from "next/link";
import { Sparkles, ImageIcon, Puzzle } from "lucide-react";

const tools = [
  {
    label: "玩法封面生成器",
    desc: "为你的玩法生成手绘风格封面",
    icon: ImageIcon,
    href: "/mod/tools",
  },
  {
    label: "SVG 素材库",
    desc: "24 种手绘 SVG 预览与下载",
    icon: Sparkles,
    href: "/mod/tools",
  },
  {
    label: "玩法流程图",
    desc: "将玩法步骤自动生成 SVG 流程图",
    icon: Puzzle,
    href: "/mod/tools",
  },
];

export function DevToolsPanel() {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">开发者工具箱</h2>
        <Link
          href="/mod/tools"
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="space-y-2">
          {tools.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-paper-warm"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg sketch-border bg-paper-warm">
                <t.icon size={18} strokeWidth={2} className="text-ink" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">{t.label}</div>
                <div className="text-xs text-ink-light">{t.desc}</div>
              </div>
              <span className="text-ink-muted">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
