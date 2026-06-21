"use client";

import { useEffect, useState } from "react";
import { Eye, Heart } from "lucide-react";

function formatCompactNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function PlayStats({
  slug,
  initialViews,
  initialLikes,
  size = "md",
}: {
  slug: string;
  initialViews: number;
  initialLikes: number;
  size?: "sm" | "md";
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const iconSize = size === "sm" ? 14 : 16;

  useEffect(() => {
    // Fetch real-time stats from API
    fetch(`/api/plays/${encodeURIComponent(slug)}/stats`)
      .then((r) => r.json())
      .then((data: { views: number; likes: number }) => {
        setViews(data.views);
        setLikes(data.likes);
      })
      .catch(() => {
        // keep initial values on error
      });
  }, [slug]);

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <Eye size={iconSize} strokeWidth={2} />
        {formatCompactNumber(views)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart size={iconSize} strokeWidth={2} />
        {formatCompactNumber(likes)}
      </span>
    </div>
  );
}

export function PlayDetailStats({
  slug,
  initialViews,
  initialLikes,
}: {
  slug: string;
  initialViews: number;
  initialLikes: number;
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Track view on page load (with localStorage debounce)
    const key = `ovofroge:viewed:${slug}`;
    const lastViewed = (() => {
      try {
        return Number(localStorage.getItem(key)) || 0;
      } catch {
        return 0;
      }
    })();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    if (now - lastViewed > tenMinutes) {
      fetch(`/api/plays/${encodeURIComponent(slug)}/view`, { method: "POST" })
        .then((r) => r.json())
        .then((data: { views: number; likes: number }) => {
          setViews(data.views);
          setLikes(data.likes);
          try {
            localStorage.setItem(key, String(now));
          } catch {
            // ignore
          }
        })
        .catch(() => {
          // ignore
        });
    }

    // Also fetch current stats
    fetch(`/api/plays/${encodeURIComponent(slug)}/stats`)
      .then((r) => r.json())
      .then((data: { views: number; likes: number }) => {
        setViews(data.views);
        setLikes(data.likes);
      })
      .catch(() => {
        // ignore
      });

    // Check if already liked
    try {
      setLiked(localStorage.getItem(`ovofroge:liked:${slug}`) === "1");
    } catch {
      // ignore
    }
  }, [slug]);

  function handleLike() {
    if (liked) return;
    fetch(`/api/plays/${encodeURIComponent(slug)}/like`, { method: "POST" })
      .then((r) => r.json())
      .then((data: { views: number; likes: number }) => {
        setLikes(data.likes);
        setLiked(true);
        try {
          localStorage.setItem(`ovofroge:liked:${slug}`, "1");
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // ignore
      });
  }

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <Eye size={16} strokeWidth={2} />
        {formatCompactNumber(views)}
      </span>
      <button
        type="button"
        onClick={handleLike}
        className={`inline-flex items-center gap-1 transition ${liked ? "text-highlight-red" : "hover:text-highlight-red"}`}
        aria-label={liked ? "已喜欢" : "喜欢"}
        disabled={liked}
      >
        <Heart size={16} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
        {formatCompactNumber(likes)}
      </button>
    </div>
  );
}
