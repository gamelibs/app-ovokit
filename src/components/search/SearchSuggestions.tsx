"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { SketchBorder } from "@/components/sketch/SketchBorder";
import { POPULAR_SEARCH_TERMS } from "@/lib/search/match";

type SearchSuggestionsProps = {
  query: string;
  onSelect: (term: string) => void;
  onClose: () => void;
  visible: boolean;
};

export function SearchSuggestions({
  query,
  onSelect,
  onClose,
  visible,
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalized = query.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalized) return POPULAR_SEARCH_TERMS.slice(0, 8);
    return POPULAR_SEARCH_TERMS.filter((t) => t.toLowerCase().includes(normalized));
  }, [normalized]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visible) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const term = suggestions[activeIndex];
        if (term) onSelect(term);
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, suggestions, activeIndex, onSelect, onClose]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (visible) {
      window.addEventListener("mousedown", onMouseDown);
      return () => window.removeEventListener("mousedown", onMouseDown);
    }
  }, [visible, onClose]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full z-50 mt-2"
    >
      <SketchBorder>
        <div className="bg-paper p-2">
          <div className="mb-1 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-ink-muted font-kalam">
            {normalized ? <Search size={12} strokeWidth={2} /> : <TrendingUp size={12} strokeWidth={2} />}
            <span>{normalized ? "相关搜索" : "热门搜索"}</span>
          </div>
          <ul className="space-y-0.5">
            {suggestions.map((term, index) => (
              <li key={term}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(term)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                    index === activeIndex
                      ? "bg-highlight-yellow/40 text-ink"
                      : "text-ink-light hover:bg-paper-warm"
                  }`}
                >
                  <Search size={14} strokeWidth={2} className="shrink-0 opacity-60" />
                  <span className="truncate">{term}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SketchBorder>
    </div>
  );
}
