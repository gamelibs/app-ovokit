"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayCover, PlayMeta } from "@/lib/content/plays";
import { TagInput } from "./TagInput";
import { BreakdownEditor } from "./BreakdownEditor";
import type { BreakdownItem } from "./BreakdownEditor";
import { CodeSnippetEditor } from "./CodeSnippetEditor";
import type { CodeSnippetItem } from "./CodeSnippetEditor";
import { CoverGenerator } from "./CoverGenerator";

type Difficulty = "入门" | "进阶" | "硬核";

function ImagePreview({
  src,
  alt,
  label,
  aspectClassName,
}: {
  src: string;
  alt: string;
  label: string;
  aspectClassName: string;
}) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl sketch-border bg-paper-warm">
      <div className={`relative w-full ${aspectClassName}`}>
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </>
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-muted">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeFallbackSlug() {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `play-${id}`;
}

function parseCsv(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const defaultBreakdown: BreakdownItem[] = [
  { title: "玩法目标", bullets: ["...", "..."] },
  { title: "核心循环", bullets: ["..."] },
];

const defaultCodeSnippets: CodeSnippetItem[] = [
  { title: "关键函数", language: "ts", code: "export function foo() {}\n" },
];

type NewPlayFormInitial = {
  meta: PlayMeta;
  articleMdx: string;
};

export function NewPlayForm({
  mode = "create",
  initial,
}: {
  mode?: "create" | "edit";
  initial?: NewPlayFormInitial;
}) {
  const router = useRouter();
  const initialSlug = initial?.meta.slug ?? "";
  const draftKey =
    mode === "edit" && initialSlug
      ? `ovokit:edit-play:${initialSlug}:draft:v1`
      : "ovokit:new-play:draft:v1";
  const coverMaxBytes = 5 * 1024 * 1024;
  const demoVideoMaxBytes = 50 * 1024 * 1024;

  const [overwrite, setOverwrite] = useState(mode === "edit");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [fallbackSlug, setFallbackSlug] = useState("play-draft");
  const [difficulty, setDifficulty] = useState<Difficulty>("入门");
  const [tags, setTags] = useState<string[]>(["推荐", "合成"]);
  const [techStack, setTechStack] = useState<string[]>(["TypeScript", "Next.js"]);
  const [corePoints, setCorePoints] = useState<string[]>(["核心点1", "核心点2"]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>(defaultBreakdown);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippetItem[]>(defaultCodeSnippets);
  const [demoNote, setDemoNote] = useState("MVP：Demo 先留 iframe 占位。");
  const [iframeSrc, setIframeSrc] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [coverWideFile, setCoverWideFile] = useState<File | null>(null);
  const [coverWidePreviewUrl, setCoverWidePreviewUrl] = useState<string>("");
  const [coverWideAlt, setCoverWideAlt] = useState<string>("");
  const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverWideError, setCoverWideError] = useState<string | null>(null);
  const [demoVideoError, setDemoVideoError] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<PlayCover | null>(null);
  const [existingCoverWide, setExistingCoverWide] = useState<PlayCover | null>(
    null,
  );
  const [existingVideoSrc, setExistingVideoSrc] = useState<string | null>(null);
  const [articleMdx, setArticleMdx] = useState(
    `# ${title || "标题"}\n\n这篇是 **MVP 占位**：后续将补充完整内容。\n`,
  );
  const [coverSvgDataUrl, setCoverSvgDataUrl] = useState<string>("");
  const [generatingArticle, setGeneratingArticle] = useState(false);

  const suggestedSlug = useMemo(() => slugify(title), [title]);
  const effectiveSlug =
    slug.trim().length > 0 ? slug.trim() : suggestedSlug || fallbackSlug;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okSlug, setOkSlug] = useState<string | null>(null);
  const [draftRestoredAt, setDraftRestoredAt] = useState<number | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (mode !== "create") return;
    setFallbackSlug(makeFallbackSlug());
  }, [mode]);

  useEffect(() => {
    if (mode !== "edit" || !initial) return;
    setTitle(initial.meta.title ?? "");
    setSubtitle(initial.meta.subtitle ?? "");
    setSlug(initial.meta.slug ?? "");
    setDifficulty((initial.meta.difficulty as Difficulty) ?? "入门");
    setTags((initial.meta.tags ?? []) as string[]);
    setTechStack(initial.meta.techStack ?? []);
    setCorePoints(initial.meta.corePoints ?? []);
    setBreakdown((initial.meta.breakdown ?? []) as BreakdownItem[]);
    setCodeSnippets((initial.meta.codeSnippets ?? []) as CodeSnippetItem[]);
    setDemoNote(initial.meta.demo?.note ?? "");
    setIframeSrc(initial.meta.demo?.iframeSrc ?? "");
    setExistingVideoSrc(initial.meta.demo?.videoSrc ?? null);
    setExistingCover(initial.meta.cover ?? null);
    setExistingCoverWide(initial.meta.coverWide ?? null);
    setCoverAlt(initial.meta.cover?.alt ?? "");
    setCoverPreviewUrl(initial.meta.cover?.src ?? "");
    setCoverWideAlt(initial.meta.coverWide?.alt ?? "");
    setCoverWidePreviewUrl(initial.meta.coverWide?.src ?? "");
    setArticleMdx(initial.articleMdx ?? "");
    setOverwrite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialSlug]);

  // 从 AI Analyzer 草稿恢复（优先级高于本地草稿）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("ovokit:analyzer-draft");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const d = parsed as Record<string, unknown>;

      setTitle(String(d.title ?? ""));
      setSubtitle(String(d.subtitle ?? ""));
      setSlug(String(d.slug ?? ""));
      setDifficulty((d.difficulty as Difficulty) ?? "入门");

      if (Array.isArray(d.tags) && d.tags.every((t) => typeof t === "string")) {
        setTags(d.tags as string[]);
      }
      if (Array.isArray(d.techStack) && d.techStack.every((t) => typeof t === "string")) {
        setTechStack(d.techStack as string[]);
      }
      if (Array.isArray(d.corePoints) && d.corePoints.every((t) => typeof t === "string")) {
        setCorePoints(d.corePoints as string[]);
      }
      if (Array.isArray(d.breakdown)) {
        setBreakdown(d.breakdown as BreakdownItem[]);
      }
      if (Array.isArray(d.codeSnippets)) {
        setCodeSnippets(d.codeSnippets as CodeSnippetItem[]);
      }
      if (typeof d.articleMdx === "string") {
        setArticleMdx(d.articleMdx);
      }
      // 封面 SVG dataUrl
      if (typeof d.coverSvgDataUrl === "string") {
        setCoverSvgDataUrl(d.coverSvgDataUrl);
        setCoverPreviewUrl(d.coverSvgDataUrl);
      }
      // Demo iframe
      if (typeof d.iframeSrc === "string") {
        setIframeSrc(d.iframeSrc);
      }
      if (typeof d.demoNote === "string") {
        setDemoNote(d.demoNote);
      }

      // 清除 analyzer draft，避免重复填充
      window.localStorage.removeItem("ovokit:analyzer-draft");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const d = parsed as Record<string, unknown>;
      setTitle(String(d.title ?? ""));
      setSubtitle(String(d.subtitle ?? ""));
      setSlug(String(d.slug ?? ""));
      setDifficulty((d.difficulty as Difficulty) ?? "入门");

      // tags
      if (Array.isArray(d.tags) && d.tags.every((t) => typeof t === "string")) {
        setTags(d.tags as string[]);
      } else {
        setTags(parseCsv(String(d.tags ?? "推荐, 合成")));
      }

      // techStack
      if (Array.isArray(d.techStack) && d.techStack.every((t) => typeof t === "string")) {
        setTechStack(d.techStack as string[]);
      } else {
        setTechStack(parseCsv(String(d.techStack ?? "TypeScript, Next.js")));
      }

      // corePoints
      if (Array.isArray(d.corePoints) && d.corePoints.every((t) => typeof t === "string")) {
        setCorePoints(d.corePoints as string[]);
      } else {
        setCorePoints(parseCsv(String(d.corePoints ?? "核心点1, 核心点2")));
      }

      // breakdown
      if (Array.isArray(d.breakdown)) {
        setBreakdown(d.breakdown as BreakdownItem[]);
      } else {
        setBreakdown(JSON.parse(String(d.breakdownJson ?? JSON.stringify(defaultBreakdown))) as BreakdownItem[]);
      }

      // codeSnippets
      if (Array.isArray(d.codeSnippets)) {
        setCodeSnippets(d.codeSnippets as CodeSnippetItem[]);
      } else {
        setCodeSnippets(JSON.parse(String(d.codeJson ?? JSON.stringify(defaultCodeSnippets))) as CodeSnippetItem[]);
      }

      setDemoNote(String(d.demoNote ?? "MVP：Demo 先留 iframe 占位。"));
      setIframeSrc(String(d.iframeSrc ?? ""));
      setCoverAlt(String(d.coverAlt ?? ""));
      setArticleMdx(String(d.articleMdx ?? `# ${String(d.title || "标题")}\n\n`));
      setOverwrite(Boolean(d.overwrite ?? false));
      if (typeof d.updatedAt === "number") setDraftRestoredAt(d.updatedAt);
    } catch {
      // ignore
    }
  }, [draftKey]);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        const payload = {
          overwrite,
          title,
          subtitle,
          slug,
          difficulty,
          tags,
          techStack,
          corePoints,
          breakdown,
          codeSnippets,
          demoNote,
          iframeSrc,
          coverAlt,
          articleMdx,
          updatedAt: Date.now(),
        };
        window.localStorage.setItem(draftKey, JSON.stringify(payload));
        setDraftSavedAt(payload.updatedAt);
      } catch {
        // ignore
      }
    }, 400);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [
    overwrite,
    title,
    subtitle,
    slug,
    difficulty,
    tags,
    techStack,
    corePoints,
    breakdown,
    codeSnippets,
    demoNote,
    iframeSrc,
    coverAlt,
    articleMdx,
    draftKey,
  ]);

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setDraftRestoredAt(null);
    setDraftSavedAt(null);
  }

  async function onPickCover(file: File | null) {
    setError(null);
    setCoverError(null);
    setCoverSvgDataUrl("");
    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl("");
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setCoverError("封面必须是图片文件");
      return;
    }
    if (file.size > coverMaxBytes) {
      setCoverError(`封面图片过大（最大 ${Math.floor(coverMaxBytes / 1024 / 1024)}MB）`);
      return;
    }
    setCoverFile(file);

    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    setCoverPreviewUrl(preview);
    setExistingCover(null);
  }

  async function onPickCoverWide(file: File | null) {
    setError(null);
    setCoverWideError(null);
    if (!file) {
      setCoverWideFile(null);
      setCoverWidePreviewUrl("");
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setCoverWideError("横向封面必须是图片文件");
      return;
    }
    if (file.size > coverMaxBytes) {
      setCoverWideError(
        `横向封面过大（最大 ${Math.floor(coverMaxBytes / 1024 / 1024)}MB）`,
      );
      return;
    }
    setCoverWideFile(file);

    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    setCoverWidePreviewUrl(preview);
    setExistingCoverWide(null);
  }

  async function onPickDemoVideo(file: File | null) {
    setError(null);
    setDemoVideoError(null);
    if (!file) {
      setDemoVideoFile(null);
      return;
    }
    if (file.type && !file.type.startsWith("video/")) {
      setDemoVideoError("Demo 必须是视频文件");
      return;
    }
    if (file.size > demoVideoMaxBytes) {
      setDemoVideoError(
        `Demo 视频过大（最大 ${Math.floor(demoVideoMaxBytes / 1024 / 1024)}MB）`,
      );
      return;
    }
    setDemoVideoFile(file);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setOkSlug(null);
    try {
      const fd = new FormData();
      fd.append(
        "payload",
        JSON.stringify({
          overwrite,
          cover: coverFile
            ? { alt: coverAlt || title || undefined }
            : coverSvgDataUrl
              ? { dataUrl: coverSvgDataUrl, alt: coverAlt || title || undefined }
              : undefined,
          coverWide: coverWideFile
            ? { alt: coverWideAlt || title || undefined }
            : undefined,
          meta: {
            slug: effectiveSlug,
            title,
            subtitle,
            cover: existingCover ?? undefined,
            coverWide: existingCoverWide ?? undefined,
            tags,
            difficulty,
            techStack,
            corePoints,
            stats: initial?.meta.stats ?? { views: 0, likes: 0 },
            published: mode === "edit" ? initial?.meta.published : false,
            breakdown,
            codeSnippets,
            demo: {
              videoSrc: existingVideoSrc ?? undefined,
              iframeSrc: iframeSrc || undefined,
              note: demoNote || undefined,
            },
          },
          articleMdx,
        }),
      );
      if (coverFile) fd.append("cover", coverFile, coverFile.name);
      if (coverWideFile) fd.append("coverWide", coverWideFile, coverWideFile.name);
      if (demoVideoFile) fd.append("demoVideo", demoVideoFile, demoVideoFile.name);

      const res = await fetch("/api/mod/plays", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { slug: string };
      setOkSlug(data.slug);
      clearDraft();
      router.push("/mod");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }

  async function generateArticle() {
    setGeneratingArticle(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          tags,
          techStack,
          corePoints,
          breakdown,
          codeSnippets,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { article: string };
      setArticleMdx(data.article);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文章生成失败");
    } finally {
      setGeneratingArticle(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <div>
          {draftRestoredAt ? (
            <span>
              已从草稿恢复（{new Date(draftRestoredAt).toLocaleString()}）。
              {draftSavedAt ? (
                <span className="ml-2">
                  最近保存：{new Date(draftSavedAt).toLocaleTimeString()}
                </span>
              ) : null}
            </span>
          ) : draftSavedAt ? (
            <span>最近保存：{new Date(draftSavedAt).toLocaleTimeString()}</span>
          ) : (
            <span>将自动保存草稿（仅本机浏览器）。</span>
          )}
        </div>
        <button
          type="button"
          className="rounded-full sketch-border bg-paper px-3 py-1 font-semibold hover:bg-paper-warm"
          onClick={clearDraft}
        >
          清除草稿
        </button>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="grid gap-3">
          <label className="flex items-center justify-between gap-3 rounded-xl sketch-border bg-paper px-3 py-2 text-sm">
            <span className="font-semibold">覆盖写入（同 slug 允许更新）</span>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">
              标题
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              placeholder="例如：合成&升级玩法核心逻辑"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">
              副标题
            </span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              placeholder="一句话概括玩法 + 技术价值"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted">
                Slug（用于 URL）
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={mode === "edit"}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60 disabled:opacity-60"
                placeholder={suggestedSlug || fallbackSlug}
              />
              <span className="text-xs text-ink-muted">
                {mode === "edit" ? (
                  <>编辑模式下不允许修改 slug（避免资源与链接错位）。 </>
                ) : null}
                仅支持小写字母/数字/连字符。建议：
                {suggestedSlug
                  ? suggestedSlug
                  : `标题无法生成英文 slug，已使用 ${fallbackSlug}（可手动修改）`}
              </span>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted">
                难度
              </span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              >
                <option value="入门">入门</option>
                <option value="进阶">进阶</option>
                <option value="硬核">硬核</option>
              </select>
            </label>
          </div>

          <TagInput
            label="标签"
            value={tags}
            onChange={setTags}
            placeholder="输入标签，回车或逗号添加"
          />

          <TagInput
            label="技术栈"
            value={techStack}
            onChange={setTechStack}
            placeholder="输入技术，回车或逗号添加"
          />

          <TagInput
            label="核心点"
            value={corePoints}
            onChange={setCorePoints}
            placeholder="输入核心点，回车或逗号添加"
          />
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="text-sm font-semibold">封面（可选）</div>
        <p className="mt-1 text-xs text-ink-muted">
          封面会写入 <code className="font-mono">public/plays/&lt;slug&gt;/cover.*</code>{" "}
          并在首页/详情展示。
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          建议比例：<code className="font-mono">3:4</code>（例如{" "}
          <code className="font-mono">900×1200</code> /{" "}
          <code className="font-mono">1080×1440</code>）。将以中心裁切适配展示区域；支持{" "}
          <code className="font-mono">png/jpg/webp/svg</code>，最大{" "}
          <code className="font-mono">5MB</code>。
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          说明：信息流会按比例裁切展示；详情页头图会以{" "}
          <code className="font-mono">4:3</code> 区域自适应（完整展示 + 模糊背景填充，不会占满屏）。
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <div className="text-xs font-semibold text-ink-muted">竖向封面</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-light file:mr-3 file:rounded-xl file:border-0 file:bg-paper-warm file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-paper-warm"
            />
            {existingCover && !coverFile && !coverSvgDataUrl ? (
              <div className="flex min-w-0 items-center gap-2 rounded-xl sketch-border bg-paper px-3 py-2 text-xs text-ink-light">
                <span className="min-w-0 flex-1 truncate">
                  已有封面：<code className="font-mono">{existingCover.src}</code>
                </span>
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-full sketch-border bg-paper px-3 py-1 font-semibold hover:bg-paper-warm"
                  onClick={() => {
                    setExistingCover(null);
                    if (!coverFile && !coverSvgDataUrl) setCoverPreviewUrl("");
                  }}
                >
                  移除
                </button>
              </div>
            ) : null}
            {coverFile ? (
              <div className="text-xs text-ink-muted">
                已选择：<code className="font-mono">{coverFile.name}</code>（
                {Math.ceil(coverFile.size / 1024)} KB）
              </div>
            ) : null}
            {coverSvgDataUrl ? (
              <div className="text-xs text-ink-muted">
                已生成手绘封面（SVG）
              </div>
            ) : null}
            {coverError ? (
              <div className="text-xs font-semibold text-red-600">
                {coverError}
              </div>
            ) : null}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted">
                封面描述（alt，可选）
              </span>
              <input
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                placeholder="默认使用标题"
              />
            </label>
            {(coverFile || coverSvgDataUrl) ? (
              <button
                type="button"
                className="h-10 w-full rounded-xl sketch-border bg-paper text-sm font-semibold hover:bg-paper-warm"
                onClick={() => {
                  setCoverFile(null);
                  setCoverSvgDataUrl("");
                  setCoverPreviewUrl("");
                }}
              >
                移除封面
              </button>
            ) : null}

            <CoverGenerator
              onGenerated={(dataUrl) => {
                setCoverSvgDataUrl(dataUrl);
                setCoverPreviewUrl(dataUrl);
                setCoverFile(null);
                setExistingCover(null);
              }}
            />
          </div>

          <ImagePreview
            src={coverPreviewUrl}
            alt={coverAlt || title || "封面"}
            label="封面预览（信息流 3:4）"
            aspectClassName="aspect-[4/3] min-[420px]:aspect-[3/4]"
          />

          <div className="grid gap-2">
            <div className="text-sm font-semibold">详情横向封面（可选）</div>
            <p className="text-xs text-ink-muted">
              建议尺寸：<code className="font-mono">1200×900</code>（横向）。不上传则详情页使用竖向封面。
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPickCoverWide(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-light file:mr-3 file:rounded-xl file:border-0 file:bg-paper-warm file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-paper-warm"
            />
            {existingCoverWide && !coverWideFile ? (
              <div className="flex min-w-0 items-center gap-2 rounded-xl sketch-border bg-paper px-3 py-2 text-xs text-ink-light">
                <span className="min-w-0 flex-1 truncate">
                  已有横向封面：<code className="font-mono">{existingCoverWide.src}</code>
                </span>
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-full sketch-border bg-paper px-3 py-1 font-semibold hover:bg-paper-warm"
                  onClick={() => {
                    setExistingCoverWide(null);
                    if (!coverWideFile) setCoverWidePreviewUrl("");
                  }}
                >
                  移除
                </button>
              </div>
            ) : null}
            {coverWideError ? (
              <div className="text-xs font-semibold text-red-600">
                {coverWideError}
              </div>
            ) : null}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted">
                横向封面描述（alt，可选）
              </span>
              <input
                value={coverWideAlt}
                onChange={(e) => setCoverWideAlt(e.target.value)}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                placeholder="默认使用标题"
              />
            </label>
            {coverWideFile ? (
              <button
                type="button"
                className="h-10 w-full rounded-xl sketch-border bg-paper text-sm font-semibold hover:bg-paper-warm"
                onClick={() => setCoverWideFile(null)}
              >
                移除横向封面
              </button>
            ) : null}
          </div>

          <ImagePreview
            src={coverWidePreviewUrl}
            alt={coverWideAlt || title || "横向封面"}
            label="横向封面预览（详情头图 4:3）"
            aspectClassName="aspect-[4/3]"
          />
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="text-sm font-semibold">玩法拆解</div>
        <p className="mt-1 text-xs text-ink-muted">
          按章节拆解玩法逻辑，每个章节包含标题和要点。
        </p>
        <div className="mt-3">
          <BreakdownEditor value={breakdown} onChange={setBreakdown} />
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="text-sm font-semibold">代码片段</div>
        <p className="mt-1 text-xs text-ink-muted">
          添加关键代码片段，支持 TypeScript / TSX / JavaScript / GLSL / JSON / MDX。
        </p>
        <div className="mt-3">
          <CodeSnippetEditor value={codeSnippets} onChange={setCodeSnippets} />
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="text-sm font-semibold">Demo（iframe）</div>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">
              iframeSrc（可选）
            </span>
            <input
              value={iframeSrc}
              onChange={(e) => setIframeSrc(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              placeholder="https://demo.example.com/..."
            />
          </label>
          <div className="grid gap-2">
            <div className="text-xs font-semibold text-ink-muted">
              或上传视频（可选）
            </div>
            {existingVideoSrc ? (
              <div className="flex min-w-0 items-center gap-2 rounded-xl sketch-border bg-paper px-3 py-2 text-xs text-ink-light">
                <span className="min-w-0 flex-1 truncate">
                  已有视频：<code className="font-mono">{existingVideoSrc}</code>
                </span>
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-full sketch-border bg-paper px-3 py-1 font-semibold hover:bg-paper-warm"
                  onClick={() => setExistingVideoSrc(null)}
                >
                  移除
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => void onPickDemoVideo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-light file:mr-3 file:rounded-xl file:border-0 file:bg-paper-warm file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-paper-warm"
            />
            <div className="text-xs text-ink-muted">
              支持 <code className="font-mono">mp4/webm</code>，最大{" "}
              <code className="font-mono">50MB</code>。上传视频后将优先展示视频，并忽略 iframe。
            </div>
            {demoVideoError ? (
              <div className="text-xs font-semibold text-red-600">
                {demoVideoError}
              </div>
            ) : null}
            {demoVideoFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl sketch-border bg-paper px-3 py-2 text-xs text-ink-light">
                <span className="truncate">{demoVideoFile.name}</span>
                <button
                  type="button"
                  className="rounded-full sketch-border bg-paper px-3 py-1 font-semibold hover:bg-paper-warm"
                  onClick={() => setDemoVideoFile(null)}
                >
                  移除
                </button>
              </div>
            ) : null}
          </div>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">
              说明（note）
            </span>
            <input
              value={demoNote}
              onChange={(e) => setDemoNote(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">文章（MDX）</div>
          <button
            type="button"
            onClick={generateArticle}
            disabled={generatingArticle || title.trim().length === 0}
            className="inline-flex h-8 items-center gap-1 rounded-lg sketch-border bg-paper px-3 text-xs font-semibold hover:bg-paper-warm disabled:opacity-50"
          >
            {generatingArticle ? "生成中..." : "🤖 AI 生成文章"}
          </button>
        </div>
        <textarea
          value={articleMdx}
          onChange={(e) => setArticleMdx(e.target.value)}
          className="mt-3 h-56 w-full rounded-xl sketch-border bg-paper p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-highlight-blue/60"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={
            busy ||
            title.trim().length === 0 ||
            subtitle.trim().length === 0 ||
            effectiveSlug.length === 0
          }
          className="inline-flex h-11 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-highlight-blue px-5 text-sm font-semibold text-ink disabled:opacity-50 sm:w-auto sm:min-w-[140px]"
        >
          {busy ? "提交中…" : okSlug ? "已发布" : mode === "edit" ? "保存修改" : "发布玩法"}
        </button>
        {error ? (
          <div className="text-sm font-semibold text-red-600">{error}</div>
        ) : null}
        {okSlug ? (
          <div className="text-sm">
            发布成功！
            <Link
              href={`/plays/${okSlug}`}
              className="ml-1 underline underline-offset-2"
            >
              查看页面
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
