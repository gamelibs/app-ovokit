"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayCover, PlayMeta } from "@/lib/content/plays";

type Difficulty = "入门" | "进阶" | "硬核";

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

const breakdownTemplate = `[
  { "title": "玩法目标", "bullets": ["...", "..."] },
  { "title": "核心循环", "bullets": ["..."] }
]`;

const codeTemplate = `[
  { "title": "关键函数", "language": "ts", "code": "export function foo() {}\\n" }
]`;

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
  const [fallbackSlug] = useState(() => makeFallbackSlug());
  const [difficulty, setDifficulty] = useState<Difficulty>("入门");
  const [tags, setTags] = useState("推荐, 合成");
  const [techStack, setTechStack] = useState("TypeScript, Next.js");
  const [corePoints, setCorePoints] = useState("核心点1, 核心点2");
  const [breakdownJson, setBreakdownJson] = useState(breakdownTemplate);
  const [codeJson, setCodeJson] = useState(codeTemplate);
  const [demoNote, setDemoNote] = useState("MVP：Demo 先留 iframe 占位。");
  const [iframeSrc, setIframeSrc] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [demoVideoError, setDemoVideoError] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<PlayCover | null>(null);
  const [existingVideoSrc, setExistingVideoSrc] = useState<string | null>(null);
  const [articleMdx, setArticleMdx] = useState(
    `# ${title || "标题"}\n\n这篇是 **MVP 占位**：后续将补充完整内容。\n`,
  );

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
    if (mode !== "edit" || !initial) return;
    setTitle(initial.meta.title ?? "");
    setSubtitle(initial.meta.subtitle ?? "");
    setSlug(initial.meta.slug ?? "");
    setDifficulty((initial.meta.difficulty as Difficulty) ?? "入门");
    setTags((initial.meta.tags ?? []).join(", "));
    setTechStack((initial.meta.techStack ?? []).join(", "));
    setCorePoints((initial.meta.corePoints ?? []).join(", "));
    setBreakdownJson(JSON.stringify(initial.meta.breakdown ?? [], null, 2));
    setCodeJson(JSON.stringify(initial.meta.codeSnippets ?? [], null, 2));
    setDemoNote(initial.meta.demo?.note ?? "");
    setIframeSrc(initial.meta.demo?.iframeSrc ?? "");
    setExistingVideoSrc(initial.meta.demo?.videoSrc ?? null);
    setExistingCover(initial.meta.cover ?? null);
    setCoverAlt(initial.meta.cover?.alt ?? "");
    setCoverPreviewUrl(initial.meta.cover?.src ?? "");
    setArticleMdx(initial.articleMdx ?? "");
    setOverwrite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialSlug]);

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
      setTags(String(d.tags ?? "推荐, 合成"));
      setTechStack(String(d.techStack ?? "TypeScript, Next.js"));
      setCorePoints(String(d.corePoints ?? "核心点1, 核心点2"));
      setBreakdownJson(String(d.breakdownJson ?? breakdownTemplate));
      setCodeJson(String(d.codeJson ?? codeTemplate));
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
          breakdownJson,
          codeJson,
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
    breakdownJson,
    codeJson,
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
      const breakdown = JSON.parse(breakdownJson) as unknown;
      const codeSnippets = JSON.parse(codeJson) as unknown;

      const fd = new FormData();
      fd.append(
        "payload",
        JSON.stringify({
          overwrite,
          cover: coverFile
            ? { alt: coverAlt || title || undefined }
            : undefined,
          meta: {
            slug: effectiveSlug,
            title,
            subtitle,
            cover: existingCover ?? undefined,
            tags: parseCsv(tags),
            difficulty,
            techStack: parseCsv(techStack),
            corePoints: parseCsv(corePoints),
            stats: { views: 0, likes: 0 },
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
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
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          onClick={clearDraft}
        >
          清除草稿
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/30">
            <span className="font-semibold">覆盖写入（同 slug 允许更新）</span>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              标题
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
              placeholder="例如：合成&升级玩法核心逻辑"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              副标题
            </span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
              placeholder="一句话概括玩法 + 技术价值"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Slug（用于 URL）
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={mode === "edit"}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
                placeholder={suggestedSlug || fallbackSlug}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                难度
              </span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
              >
                <option value="入门">入门</option>
                <option value="进阶">进阶</option>
                <option value="硬核">硬核</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              标签（逗号分隔）
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              技术栈（逗号分隔）
            </span>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              核心点（逗号分隔）
            </span>
            <input
              value={corePoints}
              onChange={(e) => setCorePoints(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">封面（可选）</div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          MVP：封面会写入 <code className="font-mono">public/plays/&lt;slug&gt;/cover.*</code>{" "}
          并在首页/详情展示。
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          建议比例：<code className="font-mono">3:4</code>（例如{" "}
          <code className="font-mono">900×1200</code> /{" "}
          <code className="font-mono">1080×1440</code>）。将以中心裁切适配展示区域；支持{" "}
          <code className="font-mono">png/jpg/webp</code>，最大{" "}
          <code className="font-mono">5MB</code>。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px] sm:items-start">
          <div className="grid gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-white/10 dark:file:text-zinc-50 dark:hover:file:bg-white/20"
            />
            {existingCover && !coverFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-white/10 dark:bg-black/30 dark:text-zinc-300">
                <span className="truncate">
                  已有封面：<code className="font-mono">{existingCover.src}</code>
                </span>
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  onClick={() => {
                    setExistingCover(null);
                    if (!coverFile) setCoverPreviewUrl("");
                  }}
                >
                  移除
                </button>
              </div>
            ) : null}
            {coverFile ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                已选择：<code className="font-mono">{coverFile.name}</code>（
                {Math.ceil(coverFile.size / 1024)} KB）
              </div>
            ) : null}
            {coverError ? (
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                {coverError}
              </div>
            ) : null}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                封面描述（alt，可选）
              </span>
              <input
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
                placeholder="默认使用标题"
              />
            </label>
            {coverFile ? (
              <button
                type="button"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white text-sm font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
                onClick={() => setCoverFile(null)}
              >
                移除封面
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
            <div className="aspect-[3/4] w-full">
              {coverPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreviewUrl}
                  alt={coverAlt || title || "封面"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-zinc-500 dark:text-zinc-400">
                  封面预览
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">结构化拆解（JSON）</div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          MVP：先用 JSON 直接编辑，后续再做可视化编辑器。
        </p>
        <textarea
          value={breakdownJson}
          onChange={(e) => setBreakdownJson(e.target.value)}
          className="mt-3 h-44 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">代码片段（JSON）</div>
        <textarea
          value={codeJson}
          onChange={(e) => setCodeJson(e.target.value)}
          className="mt-3 h-44 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">Demo（iframe）</div>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              iframeSrc（可选）
            </span>
            <input
              value={iframeSrc}
              onChange={(e) => setIframeSrc(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
              placeholder="https://demo.example.com/..."
            />
          </label>
          <div className="grid gap-2">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              或上传视频（可选）
            </div>
            {existingVideoSrc ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-white/10 dark:bg-black/30 dark:text-zinc-300">
                <span className="truncate">
                  已有视频：<code className="font-mono">{existingVideoSrc}</code>
                </span>
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
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
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-white/10 dark:file:text-zinc-50 dark:hover:file:bg-white/20"
            />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              支持 <code className="font-mono">mp4/webm</code>，最大{" "}
              <code className="font-mono">50MB</code>。上传视频后将优先展示视频，并忽略 iframe。
            </div>
            {demoVideoError ? (
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                {demoVideoError}
              </div>
            ) : null}
            {demoVideoFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-white/10 dark:bg-black/30 dark:text-zinc-300">
                <span className="truncate">{demoVideoFile.name}</span>
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  onClick={() => setDemoVideoFile(null)}
                >
                  移除
                </button>
              </div>
            ) : null}
          </div>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              说明（note）
            </span>
            <input
              value={demoNote}
              onChange={(e) => setDemoNote(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">文章（MDX）</div>
        <textarea
          value={articleMdx}
          onChange={(e) => setArticleMdx(e.target.value)}
          className="mt-3 h-56 w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:focus:ring-white/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={
            busy ||
            title.trim().length === 0 ||
            subtitle.trim().length === 0 ||
            effectiveSlug.length === 0
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "提交中..." : "写入本地内容"}
        </button>
        <Link
          href="/mod"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          返回管理
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {okSlug ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          已写入：<code className="font-mono">content/plays/{okSlug}</code>{" "}
          <Link href={`/play/${okSlug}`} className="ml-2 underline">
            打开详情页
          </Link>
        </div>
      ) : null}
    </div>
  );
}
