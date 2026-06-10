"use client";

import { useState, useCallback } from "react";
import {
  generateSketchSvg,
  sketchSvgPresets,
  type SketchSvgType,
} from "@/lib/sketch-svg";

const categories = ["全部", "基础", "流程图", "游戏", "装饰"] as const;

export function DevToolsPanel() {
  const [selected, setSelected] = useState<SketchSvgType>("gem");
  const [svg, setSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  const generate = useCallback((type: SketchSvgType) => {
    setSelected(type);
    const svgString = generateSketchSvg({
      type,
      width: 200,
      height: 140,
      roughness: 2,
      bowing: 1,
      stroke: "#202020",
      strokeWidth: 2,
      fill: "#faf7ef",
      fillStyle: "hachure",
    });
    setSvg(svgString);
    setCopied(false);
  }, []);

  const copySvg = useCallback(() => {
    if (!svg) return;
    navigator.clipboard.writeText(svg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [svg]);

  const downloadSvg = useCallback(() => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sketch-${selected}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [svg, selected]);

  const filtered =
    activeCategory === "全部"
      ? sketchSvgPresets
      : sketchSvgPresets.filter((p) => p.category === activeCategory);

  return (
    <section className="sketch-section">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-kalam text-base font-semibold">开发者工具箱</h2>
        <span className="text-xs text-ink-muted">手绘 SVG 生成器 · 按概念图约定产出</span>
      </div>

      {/* 分类筛选 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`font-kalam sketch-border px-3 py-1 text-xs font-semibold ${
              activeCategory === cat
                ? "bg-highlight-yellow text-ink"
                : "bg-paper text-ink-light hover:bg-paper-warm"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 预设按钮 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {filtered.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => generate(preset.key)}
            className={`font-kalam sketch-border px-2 py-2 text-xs font-semibold transition hover:scale-[1.02] ${
              selected === preset.key
                ? "bg-highlight-yellow text-ink"
                : "bg-paper text-ink-light hover:bg-paper-warm"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {svg ? (
        <div className="mt-4 space-y-3">
          <div className="sketch-border bg-paper p-4">
            <div
              className="mx-auto flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copySvg}
              className="sketch-button sketch-button-secondary"
            >
              {copied ? "已复制 ✓" : "复制 SVG 代码"}
            </button>
            <button
              type="button"
              onClick={downloadSvg}
              className="sketch-button sketch-button-secondary"
            >
              下载 .svg 文件
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-ink-muted">
          点击上方按钮生成手绘风格 SVG
        </div>
      )}
    </section>
  );
}
