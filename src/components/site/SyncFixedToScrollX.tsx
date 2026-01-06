"use client";

import { useEffect } from "react";

function readScrollLeft() {
  const el = document.scrollingElement;
  if (el) return el.scrollLeft;
  return document.documentElement.scrollLeft || document.body.scrollLeft || 0;
}

export function SyncFixedToScrollX() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const update = () => {
      raf = 0;
      root.style.setProperty("--ovokit-scroll-x", `${readScrollLeft()}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

