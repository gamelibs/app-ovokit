"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { svgToBitmap, downloadBlob } from "@/lib/svg-export";
import type { BitmapFormat } from "@/lib/svg-export";
import type { BreakdownItem } from "./BreakdownEditor";
import type { CodeSnippetItem } from "./CodeSnippetEditor";

type Mode = "cover" | "flowchart" | "sketch" | "full";
type CoverStyle = "sketch" | "flat" | "pixel" | "neon" | "minimal";
type SketchStyle = "wireframe" | "rough" | "colored" | "isometric";

type FullAnalysisData = {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  difficulty: "入门" | "进阶" | "硬核";
  techStack: string[];
  corePoints: string[];
  breakdown: BreakdownItem[];
  codeSnippets: CodeSnippetItem[];
  flowchartMermaid: string;
  article: string;
  coverTemplate: string;
};

type CoverResult = {
  svg: string;
  description: string;
  theme: string;
  style?: string;
};

type FlowchartResult = {
  mermaid: string;
  description: string;
  nodes: string[];
  keyLogic: string;
};

type SketchResult = {
  svg: string;
  description: string;
  uiElements: string[];
  style?: string;
};

type AnalysisResult =
  | { mode: "cover"; data: CoverResult }
  | { mode: "flowchart"; data: FlowchartResult }
  | { mode: "sketch"; data: SketchResult }
  | { mode: "full"; data: FullAnalysisData };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MODES: {
  key: Mode;
  label: string;
  icon: string;
  desc: string;
  needsScreenshot: boolean;
  needsSourceDir: boolean;
}[] = [
  {
    key: "full",
    label: "全面分析",
    icon: "🔬",
    desc: "AI 完整分析并创建帖子",
    needsScreenshot: false,
    needsSourceDir: false,
  },
  {
    key: "cover",
    label: "生成封面图",
    icon: "🎨",
    desc: "分析截图，生成 SVG 封面",
    needsScreenshot: true,
    needsSourceDir: false,
  },
  {
    key: "flowchart",
    label: "生成流程图",
    icon: "📊",
    desc: "分析源码，生成 Mermaid 流程图",
    needsScreenshot: false,
    needsSourceDir: true,
  },
  {
    key: "sketch",
    label: "生成示意图",
    icon: "✏️",
    desc: "分析截图，生成界面示意图",
    needsScreenshot: true,
    needsSourceDir: false,
  },
];

const COVER_STYLES: { key: CoverStyle; label: string; emoji: string }[] = [
  { key: "sketch", label: "手绘风格", emoji: "✏️" },
  { key: "flat", label: "扁平插画", emoji: "🎨" },
  { key: "pixel", label: "像素艺术", emoji: "👾" },
  { key: "neon", label: "霓虹发光", emoji: "💡" },
  { key: "minimal", label: "极简线条", emoji: "◯" },
];

const SKETCH_STYLES: { key: SketchStyle; label: string; emoji: string }[] = [
  { key: "rough", label: "手绘线框", emoji: "✏️" },
  { key: "wireframe", label: "纯线框图", emoji: "◻️" },
  { key: "colored", label: "彩色填充", emoji: "🎨" },
  { key: "isometric", label: "等距 3D", emoji: "📦" },
];

const PROGRESS_PHASES: Record<Mode, string[]> = {
  full: [
    "正在收集分析素材...",
    "AI 正在识别游戏类型和机制...",
    "AI 正在提炼核心玩法逻辑...",
    "AI 正在整理技术实现要点...",
    "AI 正在生成结构化报告...",
  ],
  cover: [
    "正在上传和分析截图...",
    "AI 正在识别游戏主题和视觉风格...",
    "AI 正在构思封面构图...",
    "AI 正在绘制 SVG 封面...",
    "正在渲染最终结果...",
  ],
  flowchart: [
    "正在读取源代码文件...",
    "AI 正在分析游戏核心逻辑...",
    "AI 正在梳理状态机和循环...",
    "AI 正在生成 Mermaid 流程图...",
    "正在整理流程节点...",
  ],
  sketch: [
    "正在上传和分析截图...",
    "AI 正在识别界面布局和 UI 元素...",
    "AI 正在规划线框结构...",
    "AI 正在绘制界面示意图...",
    "正在渲染最终结果...",
  ],
};

export function GameAnalyzerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sketch-button bg-highlight-yellow hover:bg-highlight-yellow/90"
      >
        🤖 分析游戏
      </button>
      {open ? <GameAnalyzerModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function GameAnalyzerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("full");
  const [step, setStep] = useState<"input" | "analyzing" | "result">("input");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [sourceDir, setSourceDir] = useState("");
  const [coverTitle, setCoverTitle] = useState("");
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("sketch");
  const [sketchStyle, setSketchStyle] = useState<SketchStyle>("rough");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = MODES.find((m) => m.key === mode)!;

  const onPickFile = useCallback(async (f: File | null) => {
    if (!f) {
      setFile(null);
      setPreviewUrl("");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result || ""));
    reader.readAsDataURL(f);
  }, []);

  const validate = useCallback((): string | null => {
    if (mode === "full") {
      if (!file && !sourceDir) {
        return "全面分析至少需要提供游戏截图或源代码目录";
      }
      return null;
    }
    if (currentMode.needsScreenshot && !file) {
      return "请上传游戏截图";
    }
    if (currentMode.needsSourceDir && !sourceDir) {
      return "请输入游戏源代码目录";
    }
    return null;
  }, [mode, currentMode, file, sourceDir]);

  const analyze = useCallback(async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setStep("analyzing");
    setError(null);
    try {
      let base64 = "";
      let mimeType = "image/png";
      if (file) {
        base64 = await fileToBase64(file);
        mimeType = file.type || "image/png";
      }

      let endpoint = "";
      let payload: Record<string, unknown> = {};

      switch (mode) {
        case "full":
          endpoint = "/api/ai/analyze-game";
          payload = {
            imageBase64: base64,
            mimeType,
            gameUrl,
            sourceDir,
          };
          break;
        case "cover":
          endpoint = "/api/ai/generate-cover";
          payload = {
            imageBase64: base64,
            mimeType,
            title: coverTitle,
            style: coverStyle,
          };
          break;
        case "flowchart":
          endpoint = "/api/ai/generate-flowchart";
          payload = {
            sourceDir,
            imageBase64: base64,
            mimeType,
            gameUrl,
          };
          break;
        case "sketch":
          endpoint = "/api/ai/generate-sketch";
          payload = {
            imageBase64: base64,
            mimeType,
            gameUrl,
            style: sketchStyle,
          };
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        [key: string]: unknown;
      };
      if (!data.ok) throw new Error(data.error || "生成失败");

      if (mode === "full") {
        const d = data.data as Record<string, unknown>;
        const fullData: FullAnalysisData = {
          title: String(d.title ?? ""),
          subtitle: String(d.subtitle ?? ""),
          slug: String(d.slug ?? generateSlug(String(d.title ?? "game"))),
          tags: Array.isArray(d.tags)
            ? d.tags.filter((t): t is string => typeof t === "string")
            : [],
          difficulty:
            d.difficulty === "入门" || d.difficulty === "进阶" || d.difficulty === "硬核"
              ? d.difficulty
              : "入门",
          techStack: Array.isArray(d.techStack)
            ? d.techStack.filter((t): t is string => typeof t === "string")
            : ["TypeScript"],
          corePoints: Array.isArray(d.corePoints)
            ? d.corePoints.filter((t): t is string => typeof t === "string")
            : [],
          breakdown: Array.isArray(d.breakdown)
            ? (d.breakdown as BreakdownItem[])
            : [],
          codeSnippets: Array.isArray(d.codeSnippets)
            ? (d.codeSnippets as CodeSnippetItem[])
            : [],
          flowchartMermaid: String(d.flowchartMermaid ?? ""),
          article: String(d.article ?? ""),
          coverTemplate: String(d.coverTemplate ?? "puzzle"),
        };
        setResult({ mode: "full", data: fullData });
      } else if (mode === "cover") {
        setResult({
          mode: "cover",
          data: {
            svg: String(data.svg ?? ""),
            description: String(data.description ?? ""),
            theme: String(data.theme ?? ""),
            style: String(data.style ?? coverStyle),
          },
        });
      } else if (mode === "flowchart") {
        setResult({
          mode: "flowchart",
          data: {
            mermaid: String(data.mermaid ?? ""),
            description: String(data.description ?? ""),
            nodes: Array.isArray(data.nodes)
              ? data.nodes.filter((n): n is string => typeof n === "string")
              : [],
            keyLogic: String(data.keyLogic ?? ""),
          },
        });
      } else {
        setResult({
          mode: "sketch",
          data: {
            svg: String(data.svg ?? ""),
            description: String(data.description ?? ""),
            uiElements: Array.isArray(data.uiElements)
              ? data.uiElements.filter((e): e is string => typeof e === "string")
              : [],
            style: String(data.style ?? sketchStyle),
          },
        });
      }
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
      setStep("input");
    } finally {
      setBusy(false);
    }
  }, [
    mode,
    file,
    sourceDir,
    gameUrl,
    coverTitle,
    coverStyle,
    sketchStyle,
    validate,
  ]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setStep("input");
    setError(null);
    setResult(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl sketch-border bg-paper p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-kalam">🤖 AI 分析游戏</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-light hover:text-ink"
          >
            ✕
          </button>
        </div>

        {/* 模式选择 */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => switchMode(m.key)}
              className={`rounded-xl sketch-border p-2.5 text-left transition ${
                mode === m.key
                  ? "bg-highlight-yellow/30 ring-2 ring-highlight-yellow"
                  : "bg-paper-warm hover:bg-paper-warm/80"
              }`}
            >
              <div className="text-base">{m.icon}</div>
              <div className="mt-0.5 text-xs font-semibold">{m.label}</div>
              <div className="mt-0.5 text-[9px] text-ink-muted leading-tight">
                {m.desc}
              </div>
            </button>
          ))}
        </div>

        {step === "input" ? (
          <InputStep
            mode={mode}
            coverStyle={coverStyle}
            onCoverStyleChange={setCoverStyle}
            sketchStyle={sketchStyle}
            onSketchStyleChange={setSketchStyle}
            file={file}
            previewUrl={previewUrl}
            gameUrl={gameUrl}
            onGameUrlChange={setGameUrl}
            sourceDir={sourceDir}
            onSourceDirChange={setSourceDir}
            coverTitle={coverTitle}
            onCoverTitleChange={setCoverTitle}
            onPickFile={onPickFile}
            onAnalyze={analyze}
            busy={busy}
            error={error}
            fileInputRef={fileInputRef}
          />
        ) : step === "analyzing" ? (
          <AnalyzingStepOverlay mode={mode} />
        ) : result ? (
          <ResultStep
            result={result}
            onBack={() => setStep("input")}
            onCreatePost={() => {
              if (result.mode === "full") {
                saveFullAnalysisToDraft(result.data);
                router.push("/mod/new");
                onClose();
              }
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function saveFullAnalysisToDraft(data: FullAnalysisData) {
  const payload = {
    title: data.title,
    subtitle: data.subtitle,
    slug: data.slug,
    tags: data.tags,
    difficulty: data.difficulty,
    techStack: data.techStack,
    corePoints: data.corePoints,
    breakdown: data.breakdown,
    codeSnippets: data.codeSnippets,
    articleMdx: data.article,
  };
  window.localStorage.setItem("ovofroge:analyzer-draft", JSON.stringify(payload));
}

function InputStep({
  mode,
  coverStyle,
  onCoverStyleChange,
  sketchStyle,
  onSketchStyleChange,
  file,
  previewUrl,
  gameUrl,
  onGameUrlChange,
  sourceDir,
  onSourceDirChange,
  coverTitle,
  onCoverTitleChange,
  onPickFile,
  onAnalyze,
  busy,
  error,
  fileInputRef,
}: {
  mode: Mode;
  coverStyle: CoverStyle;
  onCoverStyleChange: (v: CoverStyle) => void;
  sketchStyle: SketchStyle;
  onSketchStyleChange: (v: SketchStyle) => void;
  file: File | null;
  previewUrl: string;
  gameUrl: string;
  onGameUrlChange: (v: string) => void;
  sourceDir: string;
  onSourceDirChange: (v: string) => void;
  coverTitle: string;
  onCoverTitleChange: (v: string) => void;
  onPickFile: (f: File | null) => void;
  onAnalyze: () => void;
  busy: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const modeInfo = MODES.find((m) => m.key === mode)!;

  return (
    <div className="mt-4 space-y-4">
      {/* 截图上传 */}
      {modeInfo.needsScreenshot || mode === "flowchart" || mode === "full" ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">
            {modeInfo.needsScreenshot
              ? "1. 上传游戏截图（必需）"
              : mode === "full"
                ? "1. 上传游戏截图（推荐）"
                : "1. 上传游戏截图（可选）"}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            支持 png/jpg/webp，建议包含完整的游戏界面。
            {mode === "flowchart" && " 截图可辅助 AI 理解游戏界面与逻辑对应关系。"}
            {mode === "full" && " 提供截图可让 AI 更好地识别游戏类型和视觉风格。"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-ink-light file:mr-3 file:rounded-xl file:border-0 file:bg-paper-warm file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-paper-warm"
          />
          {previewUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl sketch-border">
              <img
                src={previewUrl}
                alt="预览"
                className="h-auto w-full max-h-[280px] object-contain"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 风格选择（封面/示意图模式） */}
      {mode === "cover" ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">2. 选择封面风格</div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {COVER_STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onCoverStyleChange(s.key)}
                className={`rounded-lg sketch-border px-1 py-1.5 text-[10px] font-semibold transition ${
                  coverStyle === s.key
                    ? "bg-highlight-yellow text-ink"
                    : "bg-paper text-ink-light hover:bg-paper-warm"
                }`}
              >
                <span className="mr-0.5">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : mode === "sketch" ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">2. 选择示意图风格</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {SKETCH_STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onSketchStyleChange(s.key)}
                className={`rounded-lg sketch-border px-1 py-1.5 text-[10px] font-semibold transition ${
                  sketchStyle === s.key
                    ? "bg-highlight-yellow text-ink"
                    : "bg-paper text-ink-light hover:bg-paper-warm"
                }`}
              >
                <span className="mr-0.5">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 封面标题（仅封面模式） */}
      {mode === "cover" ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">3. 游戏标题（可选）</div>
          <input
            value={coverTitle}
            onChange={(e) => onCoverTitleChange(e.target.value)}
            placeholder="例如：宝石消消乐"
            className="mt-2 h-10 w-full rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
          />
        </div>
      ) : null}

      {/* 游戏地址 */}
      <div className="rounded-xl sketch-border bg-paper-warm p-4">
        <div className="text-sm font-semibold">
          {mode === "cover"
            ? "4"
            : mode === "sketch" || mode === "full"
              ? "2"
              : "2"}
          . 游戏地址（可选）
        </div>
        <input
          value={gameUrl}
          onChange={(e) => onGameUrlChange(e.target.value)}
          placeholder="https://demo.example.com 或 http://localhost:13100"
          className="mt-2 h-10 w-full rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
        />
      </div>

      {/* 源码目录（流程图模式/全面分析模式） */}
      {mode === "flowchart" || mode === "full" ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">
            {mode === "flowchart"
              ? "3. 游戏源代码目录（必需）"
              : "3. 游戏源代码目录（可选）"}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {mode === "full"
              ? "提供源代码可让 AI 提取关键算法和流程逻辑，生成更准确的分析。"
              : "AI 会读取关键代码文件生成流程图。"}
            例如：/Users/xxx/project/my-game
          </p>
          <input
            value={sourceDir}
            onChange={(e) => onSourceDirChange(e.target.value)}
            placeholder="/path/to/your/game-source"
            className="mt-2 h-10 w-full rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border-2 border-highlight-red bg-paper p-3 text-sm text-highlight-red">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={busy}
        className="sketch-button bg-highlight-blue hover:bg-highlight-blue/90 w-full disabled:opacity-50"
      >
        {busy
          ? "生成中..."
          : `开始 ${MODES.find((m) => m.key === mode)?.label}`}
      </button>
    </div>
  );
}

function AnalyzingStepOverlay({ mode }: { mode: Mode }) {
  const phases = PROGRESS_PHASES[mode];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhaseIndex((i) => (i < phases.length - 1 ? i + 1 : i));
    }, 4000);
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return Math.min(p + Math.random() * 8 + 2, 90);
      });
    }, 1500);
    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [phases.length]);

  const modeLabels: Record<Mode, string> = {
    full: "AI 正在全面分析游戏...",
    cover: "正在生成封面...",
    flowchart: "正在生成流程图...",
    sketch: "正在生成示意图...",
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-paper/95 backdrop-blur-sm">
      <div className="w-full max-w-md px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-paper-warm sketch-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-paper-warm border-t-highlight-blue" />
        </div>
        <div className="text-center text-base font-semibold text-ink">
          {modeLabels[mode]}
        </div>
        <div className="mt-2 text-center text-sm text-ink-muted">
          {phases[phaseIndex]}
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-paper-warm">
          <div
            className="h-full rounded-full bg-highlight-blue transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-center text-xs text-ink-muted">
          {Math.round(progress)}%
        </div>
        <div className="mt-4 text-center text-[10px] text-ink-muted">
          由 Kimi K2.6 驱动 · 预计 10-30 秒
        </div>
      </div>
    </div>
  );
}

function ResultStep({
  result,
  onBack,
  onCreatePost,
}: {
  result: AnalysisResult;
  onBack: () => void;
  onCreatePost: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      {result.mode === "full" ? (
        <FullResultView data={result.data} onCreatePost={onCreatePost} />
      ) : result.mode === "cover" ? (
        <CoverResultView data={result.data} />
      ) : result.mode === "flowchart" ? (
        <FlowchartResultView data={result.data} />
      ) : (
        <SketchResultView data={result.data} />
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="sketch-button sketch-button-secondary flex-1"
        >
          ← 返回重新生成
        </button>
      </div>
    </div>
  );
}

/* ========== 全面分析结果 ========== */
function FullResultView({
  data,
  onCreatePost,
}: {
  data: FullAnalysisData;
  onCreatePost: () => void;
}) {
  const [title, setTitle] = useState(data.title);
  const [subtitle, setSubtitle] = useState(data.subtitle);
  const [slug, setSlug] = useState(data.slug);
  const [tags, setTags] = useState(data.tags.join(", "));
  const [difficulty, setDifficulty] = useState(data.difficulty);
  const [techStack, setTechStack] = useState(data.techStack.join(", "));
  const [corePoints, setCorePoints] = useState(data.corePoints.join(", "));
  const [article, setArticle] = useState(data.article);

  const handleCreatePost = useCallback(() => {
    saveFullAnalysisToDraft({
      ...data,
      title,
      subtitle,
      slug,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      difficulty,
      techStack: techStack.split(",").map((t) => t.trim()).filter(Boolean),
      corePoints: corePoints.split(",").map((t) => t.trim()).filter(Boolean),
      article,
    });
    onCreatePost();
  }, [data, title, subtitle, slug, tags, difficulty, techStack, corePoints, article, onCreatePost]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl sketch-border bg-highlight-yellow/20 p-3">
        <div className="text-sm font-semibold">
          🔬 AI 全面分析完成
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          以下是 AI 生成的完整结构化数据，你可以直接编辑修正后再创建帖子。
        </p>
      </div>

      {/* 基础信息 */}
      <div className="rounded-xl sketch-border bg-paper-warm p-4 space-y-3">
        <div className="text-sm font-semibold">基础信息</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">标题</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">副标题</span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">难度</span>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "入门" | "进阶" | "硬核")
              }
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            >
              <option value="入门">入门</option>
              <option value="进阶">进阶</option>
              <option value="硬核">硬核</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">
              标签（逗号分隔）
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">
            技术栈（逗号分隔）
          </span>
          <input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">
            核心点（逗号分隔）
          </span>
          <input
            value={corePoints}
            onChange={(e) => setCorePoints(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
          />
        </label>
      </div>

      {/* 玩法拆解预览 */}
      <div className="rounded-xl sketch-border bg-paper-warm p-4">
        <div className="text-sm font-semibold">
          玩法拆解（{data.breakdown.length} 个章节）
        </div>
        <div className="mt-2 space-y-2">
          {data.breakdown.map((b, i) => (
            <div key={i} className="rounded-lg bg-paper p-2 text-xs">
              <div className="font-semibold">{b.title}</div>
              <ul className="mt-1 list-disc pl-4 text-ink-muted">
                {b.bullets.map((bullet, j) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 代码片段预览 */}
      <div className="rounded-xl sketch-border bg-paper-warm p-4">
        <div className="text-sm font-semibold">
          代码片段（{data.codeSnippets.length} 个）
        </div>
        <div className="mt-2 space-y-2">
          {data.codeSnippets.map((c, i) => (
            <div key={i} className="rounded-lg bg-paper p-2">
              <div className="text-xs font-semibold">{c.title}</div>
              <div className="text-[10px] text-ink-muted">{c.language}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 流程图预览 */}
      {data.flowchartMermaid ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-4">
          <div className="text-sm font-semibold">流程图（Mermaid）</div>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-paper p-2 font-mono text-[10px] text-ink-light">
            {data.flowchartMermaid}
          </pre>
        </div>
      ) : null}

      {/* 文章预览 */}
      <div className="rounded-xl sketch-border bg-paper-warm p-4">
        <div className="text-sm font-semibold">文章（MDX）</div>
        <textarea
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-lg sketch-border bg-paper p-2 font-mono text-xs outline-none focus:ring-2 focus:ring-highlight-blue/60"
        />
      </div>

      {/* 创建帖子按钮 */}
      <button
        type="button"
        onClick={handleCreatePost}
        className="sketch-button bg-highlight-green hover:bg-highlight-green/90 w-full text-base"
      >
        📝 创建新帖
      </button>
      <p className="text-center text-[10px] text-ink-muted">
        点击后将跳转发帖页面，所有数据自动填充
      </p>
    </div>
  );
}

/* ========== 封面结果 ========== */
function CoverResultView({ data }: { data: CoverResult }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const styleLabel =
    COVER_STYLES.find((s) => s.key === (data.style as CoverStyle))?.label || data.style || "手绘风格";

  const svgUrl = data.svg.startsWith("data:")
    ? data.svg
    : `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data.svg)))}`;

  const copySvg = useCallback(() => {
    navigator.clipboard.writeText(data.svg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data.svg]);

  const exportBitmap = useCallback(
    async (format: BitmapFormat) => {
      if (!data.svg) return;
      setExporting(true);
      try {
        const blob = await svgToBitmap({
          svg: data.svg,
          format,
          width: 720,
          height: 960,
        });
        const ext = format === "jpg" ? "jpg" : format;
        downloadBlob(blob, `cover-${Date.now()}.${ext}`);
      } catch (e) {
        alert("导出失败: " + (e instanceof Error ? e.message : "未知错误"));
      } finally {
        setExporting(false);
      }
    },
    [data.svg],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl sketch-border bg-paper-warm p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">
            🎨 {styleLabel}封面 SVG
          </div>
          <div className="text-xs text-ink-muted">
            主题：{data.theme || "未识别"}
          </div>
        </div>
        {data.svg ? (
          <div className="mt-3 overflow-hidden rounded-xl sketch-border bg-paper">
            <img
              src={svgUrl}
              alt="封面"
              className="mx-auto h-auto max-h-[400px] w-auto"
            />
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-paper p-6 text-center text-sm text-ink-muted">
            未生成 SVG
          </div>
        )}
      </div>

      {data.description ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">设计说明</div>
          <p className="mt-1 text-sm">{data.description}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copySvg}
          disabled={exporting}
          className="sketch-button sketch-button-secondary text-xs"
        >
          {copied ? "✅ 已复制" : "📋 复制 SVG"}
        </button>
        {data.svg && (
          <a
            href={svgUrl}
            download="cover.svg"
            className="sketch-button bg-highlight-blue text-xs text-center no-underline"
          >
            ⬇️ 下载 SVG
          </a>
        )}
      </div>

      <div className="rounded-xl sketch-border bg-paper-warm p-3">
        <div className="text-xs font-semibold text-ink-muted mb-2 font-kalam">
          导出为位图格式
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["png", "jpg", "webp"] as BitmapFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => exportBitmap(fmt)}
              disabled={exporting || !data.svg}
              className="sketch-button sketch-button-secondary text-[10px] py-1.5 disabled:opacity-40"
            >
              {exporting ? "导出中..." : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== 流程图结果 ========== */
function FlowchartResultView({ data }: { data: FlowchartResult }) {
  const [copied, setCopied] = useState(false);

  const copyMermaid = useCallback(() => {
    navigator.clipboard.writeText(data.mermaid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data.mermaid]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl sketch-border bg-paper-warm p-3">
        <div className="text-sm font-semibold">📊 Mermaid 流程图</div>
        {data.mermaid ? (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-paper p-3 font-mono text-[11px] text-ink-light">
            {data.mermaid}
          </pre>
        ) : (
          <div className="mt-2 rounded-xl bg-paper p-6 text-center text-sm text-ink-muted">
            未生成流程图
          </div>
        )}
      </div>

      {data.description ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">流程说明</div>
          <p className="mt-1 text-sm">{data.description}</p>
        </div>
      ) : null}

      {data.keyLogic ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">核心逻辑</div>
          <p className="mt-1 text-sm">{data.keyLogic}</p>
        </div>
      ) : null}

      {data.nodes.length > 0 ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">流程节点</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.nodes.map((n, i) => (
              <span
                key={i}
                className="rounded-lg bg-paper px-2 py-1 text-[11px] text-ink-light sketch-border"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={copyMermaid}
        className="sketch-button sketch-button-secondary w-full text-xs"
      >
        {copied ? "✅ 已复制" : "📋 复制 Mermaid 代码"}
      </button>
    </div>
  );
}

/* ========== 示意图结果 ========== */
function SketchResultView({ data }: { data: SketchResult }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const styleLabel =
    SKETCH_STYLES.find((s) => s.key === (data.style as SketchStyle))?.label || data.style || "手绘线框";

  const svgUrl = data.svg.startsWith("data:")
    ? data.svg
    : `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data.svg)))}`;

  const copySvg = useCallback(() => {
    navigator.clipboard.writeText(data.svg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data.svg]);

  const exportBitmap = useCallback(
    async (format: BitmapFormat) => {
      if (!data.svg) return;
      setExporting(true);
      try {
        const blob = await svgToBitmap({
          svg: data.svg,
          format,
          width: 800,
          height: 1200,
        });
        const ext = format === "jpg" ? "jpg" : format;
        downloadBlob(blob, `sketch-${Date.now()}.${ext}`);
      } catch (e) {
        alert("导出失败: " + (e instanceof Error ? e.message : "未知错误"));
      } finally {
        setExporting(false);
      }
    },
    [data.svg],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl sketch-border bg-paper-warm p-3">
        <div className="text-sm font-semibold">
          ✏️ {styleLabel}示意图
        </div>
        {data.svg ? (
          <div className="mt-3 overflow-hidden rounded-xl sketch-border bg-paper">
            <img
              src={svgUrl}
              alt="示意图"
              className="mx-auto h-auto max-h-[500px] w-auto"
            />
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-paper p-6 text-center text-sm text-ink-muted">
            未生成示意图
          </div>
        )}
      </div>

      {data.description ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">设计说明</div>
          <p className="mt-1 text-sm">{data.description}</p>
        </div>
      ) : null}

      {data.uiElements.length > 0 ? (
        <div className="rounded-xl sketch-border bg-paper-warm p-3">
          <div className="text-xs font-semibold text-ink-muted font-kalam">
            识别到的 UI 元素
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.uiElements.map((e, i) => (
              <span
                key={i}
                className="rounded-lg bg-paper px-2 py-1 text-[11px] text-ink-light sketch-border"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copySvg}
          disabled={exporting}
          className="sketch-button sketch-button-secondary text-xs"
        >
          {copied ? "✅ 已复制" : "📋 复制 SVG"}
        </button>
        {data.svg && (
          <a
            href={svgUrl}
            download="sketch.svg"
            className="sketch-button bg-highlight-blue text-xs text-center no-underline"
          >
            ⬇️ 下载 SVG
          </a>
        )}
      </div>

      <div className="rounded-xl sketch-border bg-paper-warm p-3">
        <div className="text-xs font-semibold text-ink-muted mb-2 font-kalam">
          导出为位图格式
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["png", "jpg", "webp"] as BitmapFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => exportBitmap(fmt)}
              disabled={exporting || !data.svg}
              className="sketch-button sketch-button-secondary text-[10px] py-1.5 disabled:opacity-40"
            >
              {exporting ? "导出中..." : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
