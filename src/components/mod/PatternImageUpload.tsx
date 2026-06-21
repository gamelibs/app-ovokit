"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function PatternImageUpload({
  patternKey,
  initialImages,
}: {
  patternKey: string;
  initialImages: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(initialImages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function show(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/mod/patterns/${encodeURIComponent(patternKey)}/images`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => ({ error: "Upload failed" }))) as {
        ok?: boolean;
        filename?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Upload failed");
      }
      if (json.filename && !images.includes(json.filename)) {
        setImages((prev) => [...prev, json.filename!].sort());
      }
      router.refresh();
      show(`已上传 ${json.filename}`);
    } catch (e) {
      show(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove(filename: string) {
    if (!confirm(`确定删除 ${filename}？`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/mod/patterns/${encodeURIComponent(patternKey)}/images?filename=${encodeURIComponent(
          filename
        )}`,
        { method: "DELETE" }
      );
      const json = (await res.json().catch(() => ({ error: "Delete failed" }))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Delete failed");
      }
      setImages((prev) => prev.filter((n) => n !== filename));
      router.refresh();
      show(`已删除 ${filename}`);
    } catch (e) {
      show(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="sketch-button disabled:opacity-50 text-sm"
        >
          {busy ? "上传中…" : "+ 上传图片"}
        </button>
        <span className="text-xs text-ink-light">支持 png / jpg / webp / gif / svg，最大 4MB；图片会自动压缩到常用显示尺寸（最长边 ≤ 1200px）</span>
      </div>

      {message ? (
        <div className="rounded-xl border-2 border-highlight-blue bg-paper p-2 text-sm text-ink">
          {message}
        </div>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-ink-light">暂无图片。上传后会保存在 public/patterns/{patternKey}/</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((name) => (
            <div key={name} className="group relative rounded-xl sketch-border bg-paper p-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={`/patterns/${encodeURIComponent(patternKey)}/${encodeURIComponent(name)}`}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-contain"
                />
              </div>
              <div className="mt-1 truncate text-xs text-ink-light">{name}</div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(name)}
                className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper-warm text-xs font-semibold text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-highlight-red/20 disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
