"use client";

import { useState, useRef, useCallback } from "react";
import { TAG_GROUPS } from "@/lib/content/play-tags";

export function TagInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const keyword = input.trim().toLowerCase();
  const groups = TAG_GROUPS.map((g) => ({
    ...g,
    tags: g.tags.filter(
      (t) => !value.includes(t) && (keyword === "" || t.toLowerCase().includes(keyword)),
    ),
  })).filter((g) => g.tags.length > 0);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || value.includes(trimmed)) return;
      onChange([...value, trimmed]);
      setInput("");
      inputRef.current?.focus();
    },
    [value, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-ink-muted font-kalam">{label}</div>

      <div
        className="min-h-[40px] rounded-xl sketch-border bg-paper px-2 py-1.5 outline-none focus-within:ring-2 focus-within:ring-highlight-blue/60"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full sketch-border bg-paper-warm px-2.5 py-0.5 text-xs font-semibold text-ink"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-light hover:text-highlight-red"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                if (input.trim()) addTag(input);
              }
              if (e.key === "Backspace" && input === "" && value.length > 0) {
                removeTag(value[value.length - 1]);
              }
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="h-7 min-w-[80px] flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {showSuggestions && groups.length > 0 ? (
        <div className="space-y-1.5">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-wrap items-center gap-1.5">
              <span className="w-14 shrink-0 text-[10px] text-ink-muted">{g.label}：</span>
              {g.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="rounded-full sketch-border bg-paper px-2 py-0.5 text-[11px] text-ink-light hover:bg-paper-warm hover:text-ink"
                >
                  + {t}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
