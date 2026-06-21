"use client";

import { useState, useCallback } from "react";
import { generateSketchSvgDataUrl } from "@/lib/sketch-svg";
import type { SketchSvgType } from "@/lib/sketch-svg";

const COVER_TEMPLATES: { type: SketchSvgType; label: string }[] = [
  { type: "puzzle", label: "解谜" },
  { type: "gem", label: "宝石" },
  { type: "gamepad", label: "手柄" },
  { type: "blocks", label: "方块" },
  { type: "tower", label: "塔" },
  { type: "runner", label: "跑酷" },
  { type: "card", label: "卡牌" },
  { type: "lightbulb", label: "灵感" },
  { type: "sun", label: "太阳" },
  { type: "star", label: "星星" },
];

export function CoverGenerator({
  onGenerated,
}: {
  onGenerated: (dataUrl: string) => void;
}) {
  const [selected, setSelected] = useState<SketchSvgType>("puzzle");
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const generate = useCallback(() => {
    setBusy(true);
    try {
      const dataUrl = generateSketchSvgDataUrl({
        type: selected,
        width: 360,
        height: 480,
        roughness: 2.5,
        bowing: 1.2,
        stroke: "#202020",
        strokeWidth: 2.5,
        fill: "#faf7ef",
        fillStyle: "hachure",
      });
      setPreview(dataUrl);
    } finally {
      setBusy(false);
    }
  }, [selected]);

  function useAsCover() {
    if (preview) onGenerated(preview);
  }

  return (
    <div className="rounded-xl sketch-border bg-paper p-3 space-y-3">
      <div className="text-xs font-semibold text-ink-muted font-kalam">快速生成手绘封面</div>

      <div className="grid grid-cols-5 gap-1.5">
        {COVER_TEMPLATES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => {
              setSelected(t.type);
              setPreview("");
            }}
            className={`rounded-lg sketch-border px-1 py-1.5 text-[10px] font-semibold transition ${
              selected === t.type
                ? "bg-highlight-yellow text-ink"
                : "bg-paper text-ink-light hover:bg-paper-warm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="sketch-button sketch-button-secondary text-xs"
        >
          {busy ? "生成中..." : "生成预览"}
        </button>
        {preview ? (
          <button
            type="button"
            onClick={useAsCover}
            className="sketch-button bg-highlight-blue text-xs"
          >
            使用此封面
          </button>
        ) : null}
      </div>

      {preview ? (
        <div className="sketch-border bg-paper p-2">
          <img
            src={preview}
            alt="封面预览"
            className="mx-auto h-auto max-h-[200px] w-auto"
          />
        </div>
      ) : null}
    </div>
  );
}
