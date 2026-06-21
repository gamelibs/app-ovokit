"use client";

import { useState } from "react";

/**
 * 术语 hover 释义组件。
 *
 * 从 content/glossary.json 读取释义，在鼠标悬停时显示手绘风格 tooltip。
 */
export function Term({
  term,
  definition,
  children,
}: {
  term: string;
  definition: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block cursor-help border-b border-dashed border-ink-light hover:text-ink"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      role="term"
      aria-label={`${term}：${definition}`}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-xl border-2 border-ink bg-paper p-2.5 text-xs leading-relaxed text-ink shadow-sm">
          <span className="font-kalam font-bold">{term}</span>
          <span className="mt-1 block text-ink-light">{definition}</span>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-ink bg-paper" />
        </span>
      )}
    </span>
  );
}
